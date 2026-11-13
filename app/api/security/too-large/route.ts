async function reject(request:Request){await request.body?.cancel().catch(()=>{});return Response.json({error:'Request is too large.'},{status:413,headers:{'cache-control':'no-store'}});}
export async function GET(request:Request){return reject(request);}
export async function POST(request:Request){return reject(request);}
export async function PUT(request:Request){return reject(request);}
export async function PATCH(request:Request){return reject(request);}
export async function DELETE(request:Request){return reject(request);}
export async function OPTIONS(request:Request){return reject(request);}
