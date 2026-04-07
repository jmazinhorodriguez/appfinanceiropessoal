export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  return Response.json({ score: 80, summary: 'Saúde do portfólio em breve.' });
}
