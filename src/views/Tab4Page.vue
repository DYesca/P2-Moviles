<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Cuenta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Mi Cuenta</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loader -->
      <div v-if="isLoading" class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Cargando datos...</p>
      </div>

      <!-- Logged In View -->
      <div v-else-if="isLoggedIn" class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Bienvenido, {{ userName }}! 🎉</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Gestiona tu cuenta desde aquí.</p>
            <ion-list>
              <ion-item>
                <ion-label>Nombre</ion-label>
                <ion-text>{{ userName }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label>Email</ion-label>
                <ion-text>{{ userEmail }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label>Proyectos</ion-label>
                <ion-text>{{ userProjects.length }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label>Tareas</ion-label>
                <ion-text>{{ userTasks.length }}</ion-text>
              </ion-item>
            </ion-list>
            <ion-button expand="block" color="danger" @click="logout">Cerrar Sesión</ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Not Logged In View -->
      <div v-else class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Inicia Sesión</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Por favor, inicia sesión para gestionar tu cuenta.</p>
            <ion-button expand="block" @click="goToLogin">Ir al Login</ion-button>
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
  IonItem, IonLabel, IonText, IonButton, IonAlert, IonList, IonSpinner
} from '@ionic/vue';
import AuthService from '../services/AuthService'; // Importar servicio de autenticación

const router = useRouter();

// Estados reactivos
const isLoggedIn = ref(false);
const isLoading = ref(true);
const userName = ref('');
const userEmail = ref('');
const showAlert = ref(false);
const alertHeader = ref('');
const alertMessage = ref('');
const userProjects = ref([]);
const userTasks = ref([]);

// Suscribirse a cambios en el estado de autenticación
let unsubscribe: Function;

onMounted(async () => {
  // Inicializar estado de autenticación
  await AuthService.initialize();
  
  // Obtener el estado actual
  const state = AuthService.getState();
  isLoggedIn.value = state.isAuthenticated.value;
  userName.value = state.userInfo.name;
  userEmail.value = state.userInfo.email;

  isLoading.value = state.isLoading.value;
  
  // Suscribirse a cambios
  unsubscribe = AuthService.subscribe(({ isAuthenticated, userInfo, isLoading: loading }: { isAuthenticated: boolean; userInfo: { name: string; email: string; projects?: any[]; tasks?: any[] }; isLoading: boolean }) => {
    isLoggedIn.value = isAuthenticated;
    userName.value = userInfo.name;
    userEmail.value = userInfo.email;

    isLoading.value = loading;  
  });
});

onUnmounted(() => {
  // Cancelar suscripción al desmontar el componente
  if (unsubscribe) unsubscribe();
});

// Mostrar alert
const showIonicAlert = (header: string, message: string) => {
  alertHeader.value = header;
  alertMessage.value = message;
  showAlert.value = true;
};


// Logout
const logout = async () => {
  isLoading.value = true;
  const result = await AuthService.logout();
  isLoading.value = false;
  
  if (result.success) {
    showIonicAlert('Adiós 👋', 'Haz salido de tu cuenta exitosamente.');
    // Forzar la redirección inmediatamente después del logout
    setTimeout(() => {
      router.replace('/home');
    }, 500);
  } else {
    showIonicAlert('Error', 'Hubo un problema al cerrar sesión.');
  }
};

// Redirigir al login
const goToLogin = () => {
  router.push('/home');
};
</script>

<style scoped>
p {
  font-size: 16px;
  text-align: center;
  margin-bottom: 20px;
}
</style>