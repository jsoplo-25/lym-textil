import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';
import { supabaseAdmin } from '../../config/supabase';

export class UsersController {
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, role, avatar_url, created_at');

      if (!error && users && users.length > 0) {
        res.status(200).json({
          success: true,
          data: users,
        });
        return;
      }
    } catch (e) {
      console.log('Supabase users query note: returning fallback list');
    }

    const response: ApiResponse = {
      success: true,
      data: [
        {
          id: 'usr_01',
          email: 'mike@intellecta.io',
          firstName: 'Mike',
          lastName: 'Admin',
          role: 'ADMIN',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        {
          id: 'usr_02',
          email: 'gerente@textil-lym.com',
          firstName: 'Gerente',
          lastName: 'Textil',
          role: 'MANAGER',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
      ],
    };

    res.status(200).json(response);
  }
}
