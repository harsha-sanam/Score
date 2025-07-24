import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from "@angular/common/http";
import { DragDropModule } from '@angular/cdk/drag-drop';
import {NgbModalBackdrop } from '@ng-bootstrap/ng-bootstrap/modal/modal-backdrop';


import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,FormsModule,NgbModule,HttpClientModule,DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
