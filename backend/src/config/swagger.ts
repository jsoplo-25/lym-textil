import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Textiles L&M - Backend API Documentation',
      version: '1.0.0',
      description:
        'API RESTful para el Sistema de Gestión & Control de Producción Textil con Autenticación JWT y Supabase PostgreSQL.',
      contact: {
        name: 'Textiles L&M Tech Team',
        email: 'soporte@textil-lym.com',
      },
    },
    servers: [
      {
        url: `${env.API_URL}`,
        description: `Servidor Principal (${env.NODE_ENV})`,
      },
      {
        url: '/',
        description: 'Servidor Actual (Ruta relativa)',
      },
      {
        url: `http://localhost:${env.PORT}`,
        description: `Servidor Local de Desarrollo (Puerto ${env.PORT})`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu Token JWT obtenido en /auth/login o /auth/register',
        },
      },
      schemas: {
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              example: 'usuario@ejemplo.com',
            },
            password: {
              type: 'string',
              example: 'tu_contraseña_aqui',
            },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              example: 'usuario@ejemplo.com',
            },
            password: {
              type: 'string',
              example: 'tu_contraseña_aqui',
            },
            firstName: {
              type: 'string',
              example: 'Juan',
            },
            lastName: {
              type: 'string',
              example: 'Pérez',
            },
            role: {
              type: 'string',
              enum: ['ADMINISTRADOR', 'SUPERVISOR', 'OPERATOR', 'QUALITY_INSPECTOR'],
              default: 'OPERATOR',
            },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '00000000-0000-0000-0000-000000000000' },
            email: { type: 'string', example: 'usuario@ejemplo.com' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            role: { type: 'string', example: 'OPERATOR' },
            avatarUrl: { type: 'string', example: 'https://via.placeholder.com/150' },
          },
        },
        RoleInput: {
          type: 'object',
          required: ['code', 'name'],
          properties: {
            code: {
              type: 'string',
              example: 'SUPERVISOR',
              description: 'Código único identificador del rol (en mayúsculas)',
            },
            name: {
              type: 'string',
              example: 'Supervisor de Producción',
              description: 'Nombre visible y descriptivo del rol',
            },
            description: {
              type: 'string',
              example: 'Supervisión de líneas de confección, corte e hilandería',
              description: 'Descripción detallada de responsabilidades',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['dashboard:view', 'profile:view', 'users:read'],
              description: 'Lista de permisos asignados al rol',
            },
          },
        },
        RoleUpdateInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Supervisor Senior de Planta',
            },
            description: {
              type: 'string',
              example: 'Supervisión integral de módulos y control de calidad',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['dashboard:view', 'profile:view', 'profile:edit', 'users:read'],
            },
          },
        },
        RoleResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-40b9-873b-55448332b8ac' },
            code: { type: 'string', example: 'ADMINISTRADOR' },
            name: { type: 'string', example: 'Administrador General' },
            description: { type: 'string', example: 'Acceso total y control de todos los módulos.' },
            badgeLabel: { type: 'string', example: 'ADMINISTRADOR' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['dashboard:view', 'profile:view', 'users:read', 'roles:read'],
            },
            isSystem: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '2026-03-30T12:00:00.000Z' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data: { type: 'object' },
            error: { type: 'string', example: null },
          },
        },
      },
    },
    paths: {
      '/auth/login': {
        post: {
          summary: 'Iniciar sesión de usuario',
          tags: ['Autenticación'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginInput',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Inicio de sesión exitoso con token JWT generado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Inicio de sesión exitoso.' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/UserResponse' },
                          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Credenciales inválidas',
            },
          },
        },
      },
      '/auth/register': {
        post: {
          summary: 'Registrar un nuevo usuario',
          tags: ['Autenticación'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterInput',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuario creado exitosamente',
            },
            400: {
              description: 'Datos faltantes o inválidos',
            },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Obtener datos del usuario actualmente autenticado',
          tags: ['Autenticación'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Datos del usuario autenticado',
            },
            401: {
              description: 'No autorizado / Token ausente o inválido',
            },
          },
        },
      },
      '/users': {
        get: {
          summary: 'Obtener lista de usuarios registrados (ADMINISTRADOR y MANAGER)',
          tags: ['Usuarios'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de usuarios registrados',
            },
            401: {
              description: 'No autorizado',
            },
            403: {
              description: 'Permisos insuficientes',
            },
          },
        },
      },
      '/roles': {
        get: {
          summary: 'Listar todos los roles del sistema y personalizados',
          description: 'Obtiene la lista completa de roles almacenados en la base de datos con sus respectivos permisos (Disponible para roles ADMINISTRADOR y MANAGER).',
          tags: ['Roles y Permisos'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de roles obtenida exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/RoleResponse' },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Token JWT ausente o inválido' },
            403: { description: 'Acceso denegado: requiere rol ADMINISTRADOR o MANAGER' },
          },
        },
        post: {
          summary: 'Crear un nuevo rol personalizado',
          description: 'Permite registrar un nuevo rol en PostgreSQL con código único y conjunto de permisos (Exclusivo para ADMINISTRADOR).',
          tags: ['Roles y Permisos'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RoleInput' },
              },
            },
          },
          responses: {
            201: {
              description: 'Rol creado exitosamente en la base de datos',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Rol creado exitosamente en la base de datos.' },
                      data: { $ref: '#/components/schemas/RoleResponse' },
                    },
                  },
                },
              },
            },
            400: { description: 'Código o nombre faltante, o código de rol ya existente' },
            401: { description: 'No autenticado' },
            403: { description: 'Permisos insuficientes: Requiere rol ADMINISTRADOR' },
          },
        },
      },
      '/roles/{id}': {
        get: {
          summary: 'Obtener detalle de un rol por ID o código',
          description: 'Consulta los datos y permisos de un rol específico utilizando su UUID o su código identificador (ej: ADMINISTRADOR, OPERATOR).',
          tags: ['Roles y Permisos'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'UUID del rol o código (ej: ADMINISTRADOR)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Detalle del rol',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/RoleResponse' },
                    },
                  },
                },
              },
            },
            404: { description: 'Rol no encontrado en la base de datos' },
          },
        },
        put: {
          summary: 'Actualizar un rol existente (Sólo ADMINISTRADOR)',
          description: 'Actualiza nombre, descripción o la lista de permisos de un rol en la base de datos.',
          tags: ['Roles y Permisos'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'UUID del rol o código a modificar',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RoleUpdateInput' },
              },
            },
          },
          responses: {
            200: {
              description: 'Permisos del rol actualizados exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Permisos del rol actualizados exitosamente en la base de datos.' },
                      data: { $ref: '#/components/schemas/RoleResponse' },
                    },
                  },
                },
              },
            },
            400: { description: 'Error en la solicitud' },
            404: { description: 'Rol no encontrado' },
          },
        },
        delete: {
          summary: 'Eliminar un rol personalizado (Sólo ADMINISTRADOR)',
          description: 'Elimina un rol creado por el usuario. Los roles nativos del sistema (`isSystem: true`) están protegidos contra eliminación.',
          tags: ['Roles y Permisos'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'UUID del rol o código a eliminar',
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Rol eliminado correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Rol eliminado correctamente de la base de datos.' },
                    },
                  },
                },
              },
            },
            400: { description: 'Los roles nativos del sistema no pueden ser eliminados' },
            404: { description: 'Rol no encontrado' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
