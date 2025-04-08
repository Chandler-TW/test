import { Sequelize, DataTypes, Model } from 'sequelize';
import config from '../config/database';

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'mysql',
    logging: config.logging,
    timezone: '+08:00', // China timezone
  }
);

// Define models
class Service extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public duration!: number;
  public price!: number;
  public imageUrl?: string;
  public isActive!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Service.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in minutes',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'services',
  timestamps: true,
});

class Stylist extends Model {
  public id!: number;
  public name!: string;
  public imageUrl!: string;
  public specialty!: string; // JSON string of service IDs
  public rating!: number;
  public appointmentCount!: number;
  public isActive!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Stylist.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'JSON array of service IDs that the stylist specializes in',
    get() {
      const rawValue = this.getDataValue('specialty');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('specialty', JSON.stringify(value));
    },
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 5.0,
  },
  appointmentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'stylists',
  timestamps: true,
});

class StylistSchedule extends Model {
  public id!: number;
  public stylistId!: number;
  public date!: string;
  public isWorkDay!: boolean;
  public startTime?: string;
  public endTime?: string;
  public maxAppointments?: number;
  public isHoliday!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StylistSchedule.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  stylistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stylists',
      key: 'id',
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  isWorkDay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  startTime: {
    type: DataTypes.STRING(5),
    allowNull: true,
    comment: 'Format: HH:MM',
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: true,
    comment: 'Format: HH:MM',
  },
  maxAppointments: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isHoliday: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  tableName: 'stylist_schedules',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['stylistId', 'date'],
    },
  ],
});

class Customer extends Model {
  public id!: number;
  public name!: string;
  public phone!: string;
  public email?: string;
  public isActive!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Customer.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'customers',
  timestamps: true,
});

class Appointment extends Model {
  public id!: number;
  public customerId?: number;
  public customerName!: string;
  public customerPhone!: string;
  public serviceId!: number;
  public serviceName?: string;
  public stylistId?: number;
  public stylistName?: string;
  public date!: string;
  public startTime!: string;
  public endTime!: string;
  public notes?: string;
  public status!: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  public appointmentCode!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Appointment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id',
    },
  },
  customerName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id',
    },
  },
  serviceName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  stylistId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stylists',
      key: 'id',
    },
  },
  stylistName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    comment: 'Format: HH:MM',
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    comment: 'Format: HH:MM',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  appointmentCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  tableName: 'appointments',
  timestamps: true,
});

class AppointmentChangeLog extends Model {
  public id!: number;
  public appointmentId!: number;
  public userId?: number;
  public changedBy!: string;
  public oldValues!: string; // JSON string
  public newValues!: string; // JSON string
  public changeType!: 'create' | 'update' | 'status_change' | 'cancel';
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AppointmentChangeLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'appointments',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  changedBy: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Username or "customer" or "system"',
  },
  oldValues: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'JSON string of old values',
  },
  newValues: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'JSON string of new values',
  },
  changeType: {
    type: DataTypes.ENUM('create', 'update', 'status_change', 'cancel'),
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'appointment_change_logs',
  timestamps: true,
});

class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public role!: 'admin' | 'stylist' | 'customer';
  public stylistId?: number;
  public customerId?: number;
  public isActive!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'stylist', 'customer'),
    allowNull: false,
  },
  stylistId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stylists',
      key: 'id',
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id',
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
});

// Define associations
Stylist.hasMany(StylistSchedule, { 
  foreignKey: 'stylistId',
  as: 'schedules'
});
StylistSchedule.belongsTo(Stylist, { 
  foreignKey: 'stylistId',
  as: 'stylist' 
});

Customer.hasMany(Appointment, { 
  foreignKey: 'customerId',
  as: 'appointments' 
});
Appointment.belongsTo(Customer, { 
  foreignKey: 'customerId',
  as: 'customer' 
});

Service.hasMany(Appointment, { 
  foreignKey: 'serviceId',
  as: 'appointments' 
});
Appointment.belongsTo(Service, { 
  foreignKey: 'serviceId',
  as: 'service' 
});

Stylist.hasMany(Appointment, { 
  foreignKey: 'stylistId',
  as: 'appointments' 
});
Appointment.belongsTo(Stylist, { 
  foreignKey: 'stylistId',
  as: 'stylist' 
});

Appointment.hasMany(AppointmentChangeLog, { 
  foreignKey: 'appointmentId',
  as: 'changeLogs' 
});
AppointmentChangeLog.belongsTo(Appointment, { 
  foreignKey: 'appointmentId',
  as: 'appointment' 
});

Stylist.hasOne(User, { 
  foreignKey: 'stylistId',
  as: 'user' 
});
User.belongsTo(Stylist, { 
  foreignKey: 'stylistId',
  as: 'stylist' 
});

Customer.hasOne(User, { 
  foreignKey: 'customerId',
  as: 'user' 
});
User.belongsTo(Customer, { 
  foreignKey: 'customerId',
  as: 'customer' 
});

export {
  sequelize,
  Service,
  Stylist,
  StylistSchedule,
  Customer,
  Appointment,
  AppointmentChangeLog,
  User
};