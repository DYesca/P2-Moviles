<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Account</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Account</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading -->
      <div v-if="isLoading" class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Cargando...</p>
      </div>


      <!-- Login Form -->
      <div v-else-if="!isRegistering" class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Login</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input v-model="loginData.email" type="email" placeholder="Enter your email"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Password</ion-label>
              <ion-input v-model="loginData.password" type="password" placeholder="Enter your password"></ion-input>
            </ion-item>
            <ion-button expand="block" @click="handleLogin" :disabled="isSubmitting">
              <ion-spinner v-if="isSubmitting" name="dots"></ion-spinner>
              <span v-else>Login</span>
            </ion-button>
            <ion-button expand="block" fill="clear" @click="toggleRegister">Don't have an account? Register</ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Register Form -->
      <div v-else class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Register</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Name</ion-label>
              <ion-input v-model="registerData.name" type="text" placeholder="Enter your name"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input v-model="registerData.email" type="email" placeholder="Enter your email"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Password</ion-label>
              <ion-input v-model="registerData.password" type="password" placeholder="Enter your password"></ion-input>
            </ion-item>
            <ion-button expand="block" @click="handleRegister" :disabled="isSubmitting">
              <ion-spinner v-if="isSubmitting" name="dots"></ion-spinner>
              <span v-else>Register</span>
            </ion-button>
            <ion-button expand="block" fill="clear" @click="toggleRegister">Already have an account? Login</ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Alert -->
      <ion-alert
        :is-open="showAlert"
        :header="alertHeader"
        :message="alertMessage"
        :buttons="['OK']"
        @didDismiss="showAlert = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonAlert, IonSpinner
} from '@ionic/vue';
import AuthService from '../services/AuthService'; // Importar servicio de autenticación

const router = useRouter();

// Estados reactivos
const isRegistering = ref(false);
const isLoggedIn = ref(false);
const isLoading = ref(true);
const isSubmitting = ref(false);
const userName = ref('');
const showAlert = ref(false);
const alertHeader = ref('');
const alertMessage = ref('');

const loginData = ref({ email: '', password: '' });
const registerData = ref({ name: '', email: '', password: '' });

// Suscribirse a cambios en el estado de autenticación
let unsubscribe: Function;

onMounted(async () => {
  isLoading.value = true;
  
  // Inicializar estado de autenticación
  await AuthService.initialize();
  
  // Obtener el estado actual
  const state = AuthService.getState();
  isLoggedIn.value = state.isAuthenticated.value;
  userName.value = state.userInfo.name;
  isLoading.value = state.isLoading.value;
  
  // Si está autenticado, redirigir a tabs
  if (isLoggedIn.value) {
    console.log("Usuario autenticado, redirigiendo a tabs...");
    setTimeout(() => {
      router.replace('/tabs');
    }, 500);
  }
  
  // Suscribirse a cambios
  unsubscribe = AuthService.subscribe(({ isAuthenticated, userInfo, isLoading: loading }) => {
    console.log("Estado de autenticación actualizado:", isAuthenticated);
    isLoggedIn.value = isAuthenticated;
    userName.value = userInfo.name;
    isLoading.value = loading;
    
    // Si se acaba de autenticar, redirigir a tabs
    if (isAuthenticated && !loading) {
      console.log("Usuario recién autenticado, redirigiendo a tabs...");
      setTimeout(() => {
        router.replace('/tabs');
      }, 500);
    }
  });
  
  isLoading.value = false;
});

onUnmounted(() => {
  // Cancelar suscripción al desmontar el componente
  if (unsubscribe) unsubscribe();
});

// Alternar entre login y registro
const toggleRegister = () => {
  isRegistering.value = !isRegistering.value;
};

// Mostrar alert
const showIonicAlert = (header: string, message: string) => {
  alertHeader.value = header;
  alertMessage.value = message;
  showAlert.value = true;
};

// Login
const handleLogin = async () => {
  isSubmitting.value = true;
  try {
    const { success, error } = await AuthService.login(loginData.value.email, loginData.value.password);
    
    if (success) {
      showIonicAlert('Success 🎉', 'You have been logged in successfully!');
      // No necesitamos redirigir aquí, ya que AuthService notificará el cambio de estado
      // y el código de suscripción se encargará de la redirección
    } else {
      showIonicAlert('Login Failed', error?.message || 'Please check your email and password.');
    }
  } catch (error) {
    console.error('Login error:', error);
    showIonicAlert('Login Failed', 'Please check your email and password.');
  } finally {
    isSubmitting.value = false;
  }
};

// Registro
const handleRegister = async () => {
  isSubmitting.value = true;
  try {
    const { success, error } = await AuthService.register(
      registerData.value.name,
      registerData.value.email, 
      registerData.value.password
    );
    
    if (success) {
      showIonicAlert('Registro Completado ✅', 'Ahora puedes iniciar sesión.');
      toggleRegister();
    } else {
      showIonicAlert('Registro Fallido', error?.message || 'Por favor intenta de nuevo.');
    }
  } catch (error) {
    showIonicAlert('Registro Fallido', 'Por favor intenta de nuevo.');
  } finally {
    isSubmitting.value = false;
  }
};

// Logout
const logout = async () => {
  isSubmitting.value = true;
  const result = await AuthService.logout();
  isSubmitting.value = false;
  
  if (result.success) {
    showIonicAlert('Adiós 👋', 'Haz salido de tu cuenta exitosamente.');
    // Reiniciar el estado del formulario
    loginData.value = { email: '', password: '' };
    registerData.value = { name: '', email: '', password: '' };
  } else {
    showIonicAlert('Error', 'Hubo un problema al cerrar sesión.');
  }
};

// Ir a tabs
const goToTabs = () => {
  router.push('/tabs');
};
</script>

<style scoped>
p {
  font-size: 16px;
  text-align: center;
  margin-bottom: 20px;
}
</style>