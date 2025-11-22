// app/api/auth/route.js

export async function POST(req) {
  try {
    const { adminPassword } = await req.json();
    
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: "Password is required" }), { status: 400 });
    }

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 403 });
    }

    return Response.json({ success: true, message: "Authentication successful" });
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), { status: 500 });
  }
}
