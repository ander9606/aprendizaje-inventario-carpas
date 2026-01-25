require('dotenv').config();
const bcrypt = require('bcryptjs');
const AuthModel = require('./modules/auth/models/AuthModel');

async function testLogin() {
    try {
        console.log('🔍 Buscando empleado...');
        const empleado = await AuthModel.buscarPorEmail('admin@carpas.com');
        
        if (!empleado) {
            console.log('❌ Empleado no encontrado');
            process.exit(1);
        }
        
        console.log('✅ Empleado encontrado:', {
            id: empleado.id,
            nombre: empleado.nombre,
            email: empleado.email,
            rol_nombre: empleado.rol_nombre
        });
        
        console.log('\n🔐 Verificando contraseña...');
        const passwordValido = await bcrypt.compare('admin123', empleado.password_hash);
        console.log('✅ Contraseña válida:', passwordValido);
        
        if (passwordValido) {
            console.log('\n📝 Actualizando último login...');
            await AuthModel.actualizarUltimoLogin(empleado.id);
            console.log('✅ Último login actualizado');
        }
        
        console.log('\n🎉 Login test exitoso');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testLogin();
