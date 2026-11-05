import { 
  DataTypes, 
  Model, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional 
} from 'sequelize';
import db from '../Configs/db.js';
import Usuario from './Usuario.js';

export type EstadoSesion = 'activa' | 'cerrada' | 'expirada' | 'revocada';

export class Sesion extends Model<
  InferAttributes<Sesion>, 
  InferCreationAttributes<Sesion>
> {
  declare id: CreationOptional<number>;
  declare usercod: number;
  declare fechaInicio: CreationOptional<Date | string>;
  declare fechaFin: string | Date | null;
  declare ip: string;
  declare token: string;
  declare estado: CreationOptional<EstadoSesion>;
}

Sesion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usercod: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'usercod',
      },
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('activa', 'cerrada', 'expirada', 'revocada'),
      allowNull: false,
      defaultValue: 'activa',
    },
  },
  {
    sequelize: db,
    tableName: 'sesiones',
    timestamps: false,
  }
);

Usuario.hasMany(Sesion, { foreignKey: 'usercod', as: 'sesiones' });
Sesion.belongsTo(Usuario, { foreignKey: 'usercod', as: 'usuario' });

export default Sesion;