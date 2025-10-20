import app from "./app";
import { connectDB } from "./config/db";
import { sequelize } from "./config/db";
import { CronJobService } from "./utils/cronJobs";
// Importar modelos para que se registren
import "./models/user.model";
import "./models/formats.model";
import "./models/completion.model";
import "./models/validacion.model";
import "./models/notification.model";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Sincronizar modelos directamente
    await sequelize.sync({ force: false, alter: false });
    console.log("✅ Modelos sincronizados con la base de datos");
    
    // Inicializar cron jobs
    CronJobService.startAllJobs();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  CronJobService.stopAllJobs();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  CronJobService.stopAllJobs();
  process.exit(0);
});

startServer();