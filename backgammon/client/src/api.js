export async function fetchGames() {
  const res = await fetch('http://localhost:4000/games');
  if (!res.ok) throw new Error('Failed to fetch games');
  return res.json();
}