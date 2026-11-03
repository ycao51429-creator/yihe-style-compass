import {handleShowroomRequest,type ShowroomServices} from '../lib/showroom-service';
export default {fetch(request:Request,env:ShowroomServices){const path=new URL(request.url).pathname;if(path==='/api/tryon')return handleShowroomRequest(request,env,'tryon');if(path==='/api/offers')return handleShowroomRequest(request,env,'offers');return new Response('Not found',{status:404});}};
