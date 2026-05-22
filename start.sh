#!/bin/sh
node node_modules/prisma/build/index.js migrate deploy
node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.user.updateMany({where:{phone:{in:['+77011111111','+77077777771','+77033333333','+77044444444','+77055555555']}},data:{verifiedEmail:true}})
.then(()=>p.user.updateMany({where:{phone:'+77011111111'},data:{role:'ADMIN'}}))
.then(()=>p.user.updateMany({where:{phone:'+77077777771'},data:{role:'ORGANIZER'}}))
.then(()=>p.\$disconnect())
.catch(console.error)
"
node src/server.js