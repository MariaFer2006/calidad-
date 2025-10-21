import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Format } from '../models/formats.model';
import { Completion } from '../models/completion.model';
import { Validacion } from '../models/validacion.model';
import { Op } from 'sequelize';

export const getStats = async (req: Request, res: Response) => {
  try {
    console.log('📊 Obteniendo estadísticas...');
    
    // Obtener estadísticas básicas
    const totalUsers = await User.count();
    const totalFormats = await Format.count();
    const totalCompletions = await Completion.count();
    const totalValidations = await Validacion.count();

    console.log('✅ Estadísticas básicas:', { totalUsers, totalFormats, totalCompletions, totalValidations });

    // Estadísticas por estado de completions
    const completionsByStatusRaw = await Completion.findAll({
      attributes: [
        'estado',
        [Completion.sequelize!.fn('COUNT', Completion.sequelize!.col('id')), 'count']
      ],
      group: ['estado'],
      raw: true
    });

    console.log('✅ Completions por estado:', completionsByStatusRaw);

    // Mapear estados a nombres más descriptivos
    const statusLabels: { [key: string]: string } = {
      'pendiente': 'Pendientes de Revisión',
      'aprobado': 'Aprobados',
      'rechazado': 'Rechazados'
    };

    const completionsByStatus = completionsByStatusRaw.map((item: any) => ({
      name: statusLabels[item.estado] || item.estado,
      estado: item.estado,
      count: item.count,
      percentage: 0 // Se calculará después
    }));

    // Calcular porcentajes
    const totalCompletionsForPercentage = completionsByStatus.reduce((sum, item) => sum + item.count, 0);
    completionsByStatus.forEach(item => {
      item.percentage = totalCompletionsForPercentage > 0 
        ? Math.round((item.count / totalCompletionsForPercentage) * 100) 
        : 0;
    });

    // Estadísticas por estado de validaciones
    const validationsByStatus = await Validacion.findAll({
      attributes: [
        'estado',
        [Validacion.sequelize!.fn('COUNT', Validacion.sequelize!.col('id')), 'count']
      ],
      group: ['estado'],
      raw: true
    });

    console.log('✅ Validations por estado:', validationsByStatus);

    // Actividad reciente (últimos 5 registros)
    console.log('📋 Obteniendo actividad reciente...');
    const recentActivity = await Completion.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        },
        {
          model: Format,
          attributes: ['titulo']
        }
      ]
    });

    console.log('✅ Actividad reciente obtenida:', recentActivity.length, 'registros');

    // Estadísticas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCompletions = await Completion.findAll({
      attributes: [
        [Completion.sequelize!.fn('TO_CHAR', Completion.sequelize!.col('createdAt'), 'YYYY-MM'), 'month'],
        [Completion.sequelize!.fn('COUNT', Completion.sequelize!.col('id')), 'completions']
      ],
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [Completion.sequelize!.fn('TO_CHAR', Completion.sequelize!.col('createdAt'), 'YYYY-MM')],
      order: [[Completion.sequelize!.fn('TO_CHAR', Completion.sequelize!.col('createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true
    });

    const monthlyValidations = await Validacion.findAll({
      attributes: [
        [Validacion.sequelize!.fn('TO_CHAR', Validacion.sequelize!.col('createdAt'), 'YYYY-MM'), 'month'],
        [Validacion.sequelize!.fn('COUNT', Validacion.sequelize!.col('id')), 'validations']
      ],
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [Validacion.sequelize!.fn('TO_CHAR', Validacion.sequelize!.col('createdAt'), 'YYYY-MM')],
      order: [[Validacion.sequelize!.fn('TO_CHAR', Validacion.sequelize!.col('createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true
    });

    // Generar array completo de los últimos 6 meses
    const monthlyStats = [];
    const currentDate = new Date();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      const completionData = monthlyCompletions.find((comp: any) => comp.month === monthKey);
      const validationData = monthlyValidations.find((val: any) => val.month === monthKey);
      
      monthlyStats.push({
        month: monthLabel,
        monthKey: monthKey,
        completions: completionData ? parseInt((completionData as any).completions) : 0,
        validations: validationData ? parseInt((validationData as any).validations) : 0
      });
    }

    console.log('✅ Estadísticas mensuales generadas');

    // Estadísticas por estado de formatos
    const formatsByStatus = await Format.findAll({
      attributes: [
        'estado',
        [Format.sequelize!.fn('COUNT', Format.sequelize!.col('id')), 'count']
      ],
      group: ['estado'],
      raw: true
    });

    console.log('✅ Formatos por estado:', formatsByStatus);

    // Formatear actividad reciente
    const formattedRecentActivity = recentActivity.map((activity: any) => ({
      type: 'completion',
      estado: activity.estado,
      formatTitle: activity.Format?.titulo || 'Sin título',
      userName: activity.User?.name || 'Usuario desconocido',
      createdAt: new Date(activity.createdAt).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.json({
      totalUsers,
      totalFormats,
      totalCompletions,
      totalValidations,
      completionsByStatus,
      validationsByStatus: validationsByStatus,
      formatsByStatus,
      recentActivity: formattedRecentActivity,
      monthlyStats
    });
  } catch (error: any) {
    console.error('❌ Error getting stats:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUserStats = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Estadísticas del usuario actual
    const userCompletions = await Completion.count({
      where: { usuarioId: userId }
    });

    const userValidations = await Validacion.count({
      where: { validadorId: userId }
    });

    // Los formatos no tienen campo createdBy, así que contamos todos
    const userFormats = await Format.count();

    // Completions por estado del usuario
    const userCompletionsByStatus = await Completion.findAll({
      attributes: [
        'estado',
        [Completion.sequelize!.fn('COUNT', Completion.sequelize!.col('id')), 'count']
      ],
      where: { usuarioId: userId },
      group: ['estado'],
      raw: true
    });

    res.json({
      userCompletions,
      userValidations,
      userFormats,
      userCompletionsByStatus
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};