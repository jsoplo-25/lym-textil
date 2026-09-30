import swaggerJSDoc from 'swagger-jsdoc';

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
        url: 'http://localhost:4000/api/v1',
        description: 'Servidor Local de Desarrollo',
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
              enum: ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QUALITY_INSPECTOR'],
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
          summary: 'Obtener lista de usuarios registrados',
          tags: ['Usuarios'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de usuarios',
            },
          },
        },
      },
      '/tasks': {
        get: {
          summary: 'Obtener tareas del sistema',
          tags: ['Tareas'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de tareas de producción',
            },
          },
        },
        post: {
          summary: 'Crear nueva tarea',
          tags: ['Tareas'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'Inspección de Lote #402' },
                    description: { type: 'string', example: 'Control de densidad y teñido' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Tarea creada',
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
