#!/bin/sh
node node_modules/prisma/build/index.js migrate deploy
node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.user.updateMany({where:{phone:'+77011111111'},data:{role:'ADMIN',verifiedEmail:true}})
.then(()=>p.user.updateMany({where:{phone:'+77077777771'},data:{role:'ORGANIZER',verifiedEmail:true}}))
.then(()=>p.\$disconnect())
.catch(console.error)
" 
node src/server.js