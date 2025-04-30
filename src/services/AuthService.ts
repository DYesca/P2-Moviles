// src/services/AuthService.ts
import { ref, reactive, readonly } from 'vue';
import { Preferences } from '@capacitor/preferences';

// Definir interfaz para la información del usuario
interface UserInfo {
  name: string;
  email: string;
  token: string;
  projects: any[]; // Cambiar `any[]` por el tipo adecuado si se conoce
  tasks: any[];    // Cambiar `any[]` por el tipo adecuado si se conoce
}

// Estado compartido para autenticación
const isAuthenticated = ref(false);
const userInfo = reactive<UserInfo>({
  name: '',
  email: '',
  token: '',
  projects: [], // Inicializar como un array vacío
  tasks: []     // Inicializar como un array vacío
});
const isLoading = ref(false);

// Eventos para que los componentes puedan escuchar cambios de estado
const listeners: Function[] = [];

// Métodos para manejar autenticación
const AuthService = {
  // Verificar autenticación al iniciar la app
  async initialize() {
    isLoading.value = true;
    try {
      const token = await Preferences.get({ key: 'user_token' });
      const name = await Preferences.get({ key: 'user_name' });
      const email = await Preferences.get({ key: 'user_email' });
      const projects = await Preferences.get({ key: 'user_projects' });
      const tasks = await Preferences.get({ key: 'user_tasks' });

      if (token && token.value) {
        isAuthenticated.value = true;
        userInfo.token = token.value;
        userInfo.name = name?.value || 'Usuario';
        userInfo.email = email?.value || '';
        userInfo.projects = projects?.value ? JSON.parse(projects.value) : [];
        userInfo.tasks = tasks?.value ? JSON.parse(tasks.value) : [];

        // Opcionalmente, validar token con el servidor
        await this.validateToken();
      } else {
        isAuthenticated.value = false;
      }
    } catch (error) {
      console.error('Error initializing auth status:', error);
      isAuthenticated.value = false;
    } finally {
      isLoading.value = false;
    }
  },

  // Validar token con el servidor
  async validateToken() {
    try {
      const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          userInfo.name = data.data.name;
          userInfo.email = data.data.email;
          userInfo.projects = data.data.projects || []; // Cargar proyectos
          userInfo.tasks = data.data.tasks || [];       // Cargar tareas

          // Actualizar información en el almacenamiento local
          await Preferences.set({ key: 'user_name', value: data.data.name });
          await Preferences.set({ key: 'user_email', value: data.data.email });
          await Preferences.set({ key: 'user_projects', value: JSON.stringify(data.data.projects || []) });
          await Preferences.set({ key: 'user_tasks', value: JSON.stringify(data.data.tasks || []) });
        }
        return true;
      } else {
        // Token no válido, cerrar sesión
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  },

  // Iniciar sesión
  async login(email: string, password: string) {
    isLoading.value = true;
    try {
      const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Login failed');
      }

      // Guardar token
      await Preferences.set({ key: 'user_token', value: data.token });
      userInfo.token = data.token;

      // Obtener datos del perfil
      const profileResponse = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.data) {
          userInfo.name = profileData.data.name;
          userInfo.email = profileData.data.email;
          userInfo.projects = profileData.data.projects || []; // Cargar proyectos
          userInfo.tasks = profileData.data.tasks || [];       // Cargar tareas

          // Guardar información del usuario
          await Preferences.set({ key: 'user_name', value: profileData.data.name });
          await Preferences.set({ key: 'user_email', value: profileData.data.email });
          await Preferences.set({ key: 'user_projects', value: JSON.stringify(profileData.data.projects || []) });
          await Preferences.set({ key: 'user_tasks', value: JSON.stringify(profileData.data.tasks || []) });
        }
      }

      isAuthenticated.value = true;
      this.notifyListeners();
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    } finally {
      isLoading.value = false;
    }
  },

  // Registrar usuario
  async register(name: string, email: string, password: string) {
    isLoading.value = true;
    try {
      const response = await fetch('https://po02projectmanagerapi-production.up.railway.app/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    } finally {
      isLoading.value = false;
    }
  },

  // Cerrar sesión
  async logout() {
    isLoading.value = true;
    try {
      // Intentar cerrar sesión en el servidor
      if (userInfo.token) {
        try {
          await fetch('https://po02projectmanagerapi-production.up.railway.app/api/logout', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userInfo.token}`
            }
          });
        } catch (e) {
          console.error('Error logging out on server:', e);
        }
      }

      // Limpiar datos locales antes de cambiar el estado para asegurar consistencia
      await Preferences.remove({ key: 'user_token' });
      await Preferences.remove({ key: 'user_name' });
      await Preferences.remove({ key: 'user_email' });
      await Preferences.remove({ key: 'user_projects' });
      await Preferences.remove({ key: 'user_tasks' });

      // Actualizar estado después de limpiar storage
      isAuthenticated.value = false;
      userInfo.name = '';
      userInfo.email = '';
      userInfo.token = '';
      userInfo.projects = [];
      userInfo.tasks = [];

      // Notificar a todos los componentes del cambio
      this.notifyListeners();

      // Dar tiempo para que la notificación se procese
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true, redirectTo: '/home' };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error };
    } finally {
      isLoading.value = false;
    }
  },

  // Suscribirse a cambios en el estado de autenticación
  subscribe(callback: Function) {
    listeners.push(callback);
    // Devolver función para darse de baja
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  // Notificar a los suscriptores sobre cambios
  notifyListeners() {
    listeners.forEach(callback => callback({
      isAuthenticated: isAuthenticated.value,
      userInfo: { ...userInfo },
      isLoading: isLoading.value
    }));
  },

  // Exponer estado como solo lectura
  getState() {
    return {
      isAuthenticated: readonly(isAuthenticated),
      userInfo: readonly(userInfo),
      isLoading: readonly(isLoading)
    };
  }
};

export default AuthService;