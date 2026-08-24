const app=require('./app');
const port=process.env.PORT||3000;
if(require.main===module){app.listen(port,()=>console.log(`Wisata API running on http://localhost:${port}`));}
module.exports=app;
