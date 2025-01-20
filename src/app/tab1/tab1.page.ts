import { ViewChild, ElementRef,Component, signal } from '@angular/core';
import { IonCardContent, IonButton, IonList, IonItem, IonLabel,IonFab, IonFabButton, IonIcon, IonCard,IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
/* Importe el pipe */
import { PercentPipe } from '@angular/common';
/* Importe la función y el ícono */
import { addIcons } from 'ionicons';
import { cloudUploadOutline } from 'ionicons/icons';
/* Importe el servicio */
import { TeachablemachineService } from '../services/teachablemachine.service';
import { CommonModule } from '@angular/common'; // Importar CommonModule


@Component({
  selector: 'app-tab1',
  standalone: true,
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule,PercentPipe,IonCardContent, IonButton, IonList, IonItem, IonLabel,IonFab, IonFabButton, IonIcon, IonCard,IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})

export class Tab1Page {
    // Declarar las propiedades que se usan en la plantilla
    predictionMessage: string = '';
    recommendationLink: string = '';
  isJorobado: boolean = false;
  showMessage: boolean = false;

  imageReady = signal(false)
  imageUrl = signal("")

  /* Declare los atributos para almacenar el modelo y la lista de clases */
  modelLoaded = signal(false);
  classLabels: string[] = [];
  /* Declare la referencia al elemento con el id image */
  @ViewChild('image', { static: false }) imageElement!: ElementRef<HTMLImageElement>;

  /* Lista de predicciones */
  predictions: any[] = [];

  constructor(private teachablemachine: TeachablemachineService) {
     /* Registre el ícono */
     addIcons({ cloudUploadOutline });
  }

  /* El método onSubmit para enviar los datos del formulario mediante el servicio */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
    
      const reader = new FileReader();

      // Convertir el archivo a una URL base64 para mostrarlo en el html
      reader.onload = () => {
        this.imageUrl.set(reader.result as string)
        this.imageReady.set(true)
      };
      reader.readAsDataURL(file); // Leer el archivo como base64
    }
  }


  /* Método ngOnInit para cargar el modelo y las clases */
  async ngOnInit() {
    await this.teachablemachine.loadModel()
    this.classLabels = this.teachablemachine.getClassLabels()
    this.modelLoaded.set(true)
  }

  /* Método para obtener la predicción a partir de la imagen */
/* Método para obtener la predicción a partir de la imagen */
async predict() {
  try {
    const image = this.imageElement.nativeElement; // Obtén la imagen seleccionada
    this.predictions = await this.teachablemachine.predict(image); // Realiza la predicción

    // Verifica si alguna de las predicciones es "jorobado" con probabilidad mayor al 50%
    const jorobadoPrediction = this.predictions.find(
      (prediction: any) =>
        prediction.className.toLowerCase() === 'jorobado' &&
        prediction.probability > 0.5
    );

    // Si hay una predicción "jorobado" y la probabilidad es mayor al 50%, se guarda el mensaje
    if (jorobadoPrediction) {
      this.predictionMessage = 'Tu postura parece jorobada. Visita este sitio para mejorarla:';
      this.recommendationLink = 'https://medlineplus.gov/spanish/guidetogoodposture.html';
    } else {
      this.predictionMessage = '¡Felicidades! Tu postura es excelente.';
      this.recommendationLink = '';
    }

    this.showMessage = true; // Activa la visualización del mensaje

  } catch (error) {
    console.error(error);
    alert('Error al realizar la predicción.');
  }
}


}
