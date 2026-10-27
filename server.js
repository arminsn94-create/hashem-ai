import express from "express";
import multer from "multer";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({storage: multer.memoryStorage(), limits:{fileSize:10*1024*1024}, fileFilter:(_req,file,cb)=>cb(["image/png","image/jpeg","image/webp"].includes(file.mimetype)?null:new Error("Only PNG/JPG/WEBP allowed."),["image/png","image/jpeg","image/webp"].includes(file.mimetype))});
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/status",(_req,res)=>res.json({ready:Boolean(process.env.OPENAI_API_KEY)}));
app.post("/api/edit",upload.single("image"),async(req,res)=>{
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"سرویس هنوز پیکربندی نشده؛ مدیر سایت باید کلید API را روی سرور تنظیم کند."});
 if(!req.file)return res.status(400).json({error:"اول یک عکس انتخاب کن."});
 const prompt=String(req.body.prompt||"").trim();
 if(!prompt)return res.status(400).json({error:"توضیح تغییر عکس را بنویس."});
 if(prompt.length>1500)return res.status(400).json({error:"توضیح خیلی طولانی است."});
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const imageFile=new File([req.file.buffer],req.file.originalname||"upload.png",{type:req.file.mimetype});
  const result=await client.images.edit({model:"gpt-image-1",image:imageFile,prompt,size:"1024x1024"});
  const encoded=result.data?.[0]?.b64_json;
  if(!encoded)throw new Error("No image returned");
  res.json({image:`data:image/png;base64,${encoded}`});
 }catch(err){console.error("Image edit failed:",err?.message||err);res.status(502).json({error:"ویرایش انجام نشد؛ دسترسی API و اعتبار حساب را بررسی کن."});}
});
app.use((err,_req,res,_next)=>res.status(400).json({error:err.message||"درخواست نامعتبر است."}));
app.listen(process.env.PORT||3000,()=>console.log("Hashem AI started"));
