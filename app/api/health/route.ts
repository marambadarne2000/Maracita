import {database} from '@/lib/scheduling';
export async function GET(){try{await database.DB.prepare('SELECT 1 AS ok').first();return Response.json({status:'ok',service:'maracita',version:'2026.10.23',checkedAt:new Date().toISOString()},{headers:{'cache-control':'no-store'}});}catch{return Response.json({status:'unavailable'},{status:503,headers:{'cache-control':'no-store'}});}}
