<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from './services/AuthService';

const router = useRouter();

// Inicializar el servicio de autenticación al cargar la aplicación
onMounted(async () => {
  console.log("Inicializando servicio de autenticación...");
  await AuthService.initialize();
  console.log("Servicio de autenticación inicializado.");
  
  // Verificar la ruta actual y el estado de autenticación
  const currentRoute = router.currentRoute.value.path;
  const state = AuthService.getState();
  const isAuthenticated = state.isAuthenticated.value;
  
  console.log("Ruta actual:", currentRoute);
  console.log("Usuario autenticado:", isAuthenticated);
  
  // Redirigir según estado de autenticación
  if (isAuthenticated && currentRoute === '/home') {
    console.log("Usuario autenticado en /home, redirigiendo a /tabs...");
    router.replace('/tabs');
  } else if (!isAuthenticated && currentRoute.startsWith('/tabs')) {
    console.log("Usuario no autenticado en /tabs, redirigiendo a /home...");
    router.replace('/home');
  }
});
</script>

<style scoped>
/* Tus estilos globales aquí */
</style>