import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <p>© 2026 Hugo Tejero con mucho ❤️</p>
    </footer>
  `,
  styles: [`
    .footer {
      text-align: center;
      padding: 1.2rem;
      color: #888;
      font-size: 0.85rem;
      border-top: 1px solid rgba(233, 69, 96, 0.15);
      background: #0d0d0d;
    }
  `]
})
export class FooterComponent {}
