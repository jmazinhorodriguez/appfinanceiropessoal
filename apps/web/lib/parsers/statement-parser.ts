import { parse as parseCSV } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import pdfParse from 'pdf-parse';

export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
};

// Tipos explícitos para rows de CSV e XLSX — sem "any"
interface CSVRow {
  [key: string]: string;
}

interface XLSXRow {
  [key: string]: string | number | boolean | null;
}

export async function parseStatement(buffer: Buffer, fileType: string): Promise<ParsedTransaction[]> {
  let txs: ParsedTransaction[] = [];

  if (fileType === 'csv')       txs = parseCSVContent(buffer);
  else if (fileType === 'xlsx') txs = parseXLSXContent(buffer);
  else if (fileType === 'ofx')  txs = parseOFXContent(buffer.toString('utf-8'));
  else if (fileType === 'pdf')  txs = await parsePDFContent(buffer);

  return txs.map(categorize);
}

function parseCSVContent(buffer: Buffer): ParsedTransaction[] {
  const records = parseCSV(buffer, { 
    columns: true, 
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
    delimiter: [',', ';', '\t']
  }) as CSVRow[];
  return records
    .map((row: CSVRow): ParsedTransaction | null => {
      const dateStr = row['Data'] ?? row['Date'] ?? row['Data Lançamento'] ?? Object.values(row)[0] ?? '';
      const desc    = row['Descrição'] ?? row['Description'] ?? row['Histórico'] ?? Object.values(row)[1] ?? '';
      const valStr  = row['Valor'] ?? row['Amount'] ?? Object.values(row)[2] ?? '0';

      const amount = parseFloat(String(valStr).replace(/\./g, '').replace(',', '.'));
      if (isNaN(amount)) return null;

      return {
        date:        formatDateString(dateStr),
        description: String(desc),
        amount:      Math.abs(amount),
        type:        amount >= 0 ? 'receita' : 'despesa',
        category:    'Outros',
      };
    })
    .filter((tx): tx is ParsedTransaction => tx !== null && tx.date.length > 0);
}

function parseXLSXContent(buffer: Buffer): ParsedTransaction[] {
  const workbook  = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rows      = xlsx.utils.sheet_to_json<XLSXRow>(workbook.Sheets[sheetName]);

  return rows
    .map((row: XLSXRow): ParsedTransaction | null => {
      const vals    = Object.values(row);
      const dateStr = String(vals[0] ?? '');
      const desc    = String(vals[1] ?? '');
      const valAmt  = parseFloat(String(vals[2] ?? '0'));

      if (isNaN(valAmt)) return null;

      return {
        date:        formatDateString(dateStr),
        description: desc,
        amount:      Math.abs(valAmt),
        type:        valAmt >= 0 ? 'receita' : 'despesa',
        category:    'Outros',
      };
    })
    .filter((tx): tx is ParsedTransaction => tx !== null && tx.date.length > 0);
}

function parseOFXContent(content: string): ParsedTransaction[] {
  const txs: ParsedTransaction[] = [];
  const stmtRegex = /<STMTTRN>[\s\S]*?<\/STMTTRN>/g;
  let match: RegExpExecArray | null;

  while ((match = stmtRegex.exec(content)) !== null) {
    const block     = match[0];
    const dateMatch = block.match(/<DTPOSTED>(.*?)(?:\[|<\/DTPOSTED>)/);
    const amtMatch  = block.match(/<TRNAMT>(.*?)(?:<\/TRNAMT>|<)/);
    const memoMatch = block.match(/<MEMO>(.*?)(?:<\/MEMO>|<)/);

    if (dateMatch && amtMatch) {
      const dStr   = dateMatch[1].substring(0, 8); // YYYYMMDD
      const date   = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
      const amount = parseFloat(amtMatch[1]);

      txs.push({
        date,
        description: memoMatch ? memoMatch[1] : '',
        amount:      Math.abs(amount),
        type:        amount >= 0 ? 'receita' : 'despesa',
        category:    'Outros',
      });
    }
  }

  return txs;
}

async function parsePDFContent(buffer: Buffer): Promise<ParsedTransaction[]> {
  const data  = await pdfParse(buffer);
  const lines = data.text.split('\n');
  const txs: ParsedTransaction[] = [];

  // Match: "12/03" or "12/03/2024" or "12 MAR"
  // Followed by description
  // Followed by value like "-15,00", "15,00 D", "1.000,00", "R$ 15,00"
  const lineRegex = /^\s*(\d{2}\/\d{2}(?:\/\d{4})?|\d{2}\s+[a-zA-Z]{3})\s+(.+?)\s+((?:R\$)?\s?-?[\d]{1,3}(?:\.[\d]{3})*,\d{2}(?:\s*[CD\-])?)/i;

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (!m) continue;

    const dateStr = m[1];
    const desc    = m[2].trim();
    const valRaw  = m[3].replace(/R\$\s?/gi, '').trim();
    
    // Check if debit
    let isNegative = valRaw.includes('-') || valRaw.toUpperCase().endsWith('D');
    // If it explicitly ends with 'C', it's a credit, otherwise assume credit if no minus/D
    let cleanVal = valRaw.replace(/[CD\-]/gi, '').trim();
    
    const amount  = parseFloat(cleanVal.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount)) continue;
    
    const finalAmount = isNegative ? -amount : amount;

    txs.push({
      date:        formatDateString(dateStr),
      description: desc,
      amount:      Math.abs(amount),
      type:        finalAmount >= 0 ? 'receita' : 'despesa',
      category:    'Outros',
    });
  }

  return txs;
}

function formatDateString(dateStr: string): string {
  const dd_mm_yyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dd_mm_yyyy) return `${dd_mm_yyyy[3]}-${dd_mm_yyyy[2]}-${dd_mm_yyyy[1]}`;

  const dd_mm_yy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (dd_mm_yy) return `20${dd_mm_yy[3]}-${dd_mm_yy[2]}-${dd_mm_yy[1]}`;

  const dd_mm = dateStr.match(/^(\d{2})\/(\d{2})$/);
  if (dd_mm) {
     return `${new Date().getFullYear()}-${dd_mm[2]}-${dd_mm[1]}`;
  }

  const months: Record<string, string> = { jan:'01', fev:'02', mar:'03', abr:'04', mai:'05', jun:'06', jul:'07', ago:'08', set:'09', out:'10', nov:'11', dez:'12' };
  const d_MMM = dateStr.toLowerCase().match(/^(\d{2})\s+([a-z]{3})$/);
  if (d_MMM) {
    const mm = months[d_MMM[2]] || '01';
    return `${new Date().getFullYear()}-${mm}-${d_MMM[1]}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  return new Date().toISOString().split('T')[0];
}

export function categorize(tx: ParsedTransaction): ParsedTransaction {
  const desc = tx.description.toLowerCase();

  if (desc.includes('uber') || desc.includes('99app') || desc.includes('posto'))
    tx.category = 'Transporte';
  else if (desc.includes('ifood') || desc.includes('restaurante') || desc.includes('padaria'))
    tx.category = 'Alimentação';
  else if (desc.includes('farmacia') || desc.includes('hospital') || desc.includes('unimed'))
    tx.category = 'Saúde';
  else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cinema'))
    tx.category = 'Entretenimento';
  else if (desc.includes('faculdade') || desc.includes('curso') || desc.includes('escola'))
    tx.category = 'Educação';
  else if (desc.includes('cemig') || desc.includes('copasa') || desc.includes('aluguel'))
    tx.category = 'Moradia';
  else if (desc.includes('xp') || desc.includes('rico') || desc.includes('b3') || desc.includes('corretora'))
    tx.category = 'Investimentos';
  else if (desc.includes('zara') || desc.includes('renner') || desc.includes('shopee'))
    tx.category = 'Vestuário';
  else
    tx.category = 'Outros';

  return tx;
}
