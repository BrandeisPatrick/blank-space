export async function POST(request: Request) {
  return new Response(
    JSON.stringify({ 
      message: 'API endpoint working!', 
      timestamp: new Date().toISOString() 
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export async function GET(request: Request) {
  return new Response(
    JSON.stringify({ 
      message: 'API endpoint working!', 
      timestamp: new Date().toISOString() 
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}