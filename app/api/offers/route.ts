import {env} from 'cloudflare:workers';
import {handleShowroomRequest,type ShowroomServices} from '../../../lib/showroom-service';
export function POST(request:Request){return handleShowroomRequest(request,env as unknown as ShowroomServices,'offers');}
export function OPTIONS(request:Request){return handleShowroomRequest(request,env as unknown as ShowroomServices,'offers');}
