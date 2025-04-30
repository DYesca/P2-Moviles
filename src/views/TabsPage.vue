<template>
    <ion-page>
      <ion-tabs>
        <ion-router-outlet></ion-router-outlet>
        <ion-tab-bar slot="bottom">
          <ion-tab-button tab="tab1" href="/tabs/tab1">
            <ion-icon aria-hidden="true" :icon="bookOutline"></ion-icon>
            <ion-label>Gestionar Proyectos</ion-label>
          </ion-tab-button>
  
          <ion-tab-button tab="tab2" href="/tabs/tab2">
            <ion-icon aria-hidden="true" :icon="createOutline" />
            <ion-label>Crear un Proyecto</ion-label>
          </ion-tab-button>
  
          <ion-tab-button tab="tab3" href="/tabs/tab3">
            <ion-icon aria-hidden="true" :icon="notificationsOutline" />
            <ion-label>Notificaciones</ion-label>
          </ion-tab-button>
  
          <ion-tab-button tab="tab4" href="/tabs/tab4">
            <ion-icon aria-hidden="true" :icon="personOutline" />
            <ion-label>Account</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
  import { bookOutline, personOutline, notificationsOutline, createOutline} from 'ionicons/icons';
  import { logoIonic } from 'ionicons/icons';

  import { list, folder, notifications, person } from 'ionicons/icons';
  import { onMounted, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import AuthService from '../services/AuthService';
  
  const router = useRouter();
  let unsubscribe: Function;
  
  onMounted(async () => {
    // Verificar si el usuario está autenticado
    await AuthService.initialize();
    const state = AuthService.getState();
    
    // Si el usuario no está autenticado, redirigir al login
    if (!state.isAuthenticated.value) {
      console.log("No autenticado, redirigiendo al login...");
      router.replace('/home');
    }
    
    // Suscribirse a cambios en el estado de autenticación
    unsubscribe = AuthService.subscribe(({ isAuthenticated }) => {
      if (!isAuthenticated) {
        console.log("Sesión cerrada, redirigiendo al login...");
        router.replace('/home');
      }
    });
  });
  
  onBeforeUnmount(() => {
    // Cancelar suscripción al desmontar el componente
    if (unsubscribe) unsubscribe();
  });
  </script>