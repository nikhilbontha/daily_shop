import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Add New Product</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="fill">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="productForm.get('name')?.errors?.['required']">
              Name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="4"></textarea>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Price</mat-label>
            <input matInput type="number" formControlName="price" required min="0">
            <mat-error *ngIf="productForm.get('price')?.errors?.['required']">
              Price is required
            </mat-error>
            <mat-error *ngIf="productForm.get('price')?.errors?.['min']">
              Price must be greater than 0
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Count in Stock</mat-label>
            <input matInput type="number" formControlName="countInStock" required min="0">
            <mat-error *ngIf="productForm.get('countInStock')?.errors?.['required']">
              Stock count is required
            </mat-error>
            <mat-error *ngIf="productForm.get('countInStock')?.errors?.['min']">
              Stock count must be greater than or equal to 0
            </mat-error>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" routerLink="/products">Cancel</button>
            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="productForm.invalid">
              Save Product
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 600px;
      margin: 20px auto;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      countInStock: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.productForm.valid) {
      this.productService.createProduct(this.productForm.value).subscribe({
        next: () => {
          this.snackBar.open('Product created successfully', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/products']);
        },
        error: (error) => {
          this.snackBar.open('Failed to create product', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}