import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-selector',
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
})
export class LanguageSelectorComponent implements OnInit {
  isOpen = false;
  selectedLanguage: Language = {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  };

  languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    // Set default language
    this.translate.setDefaultLang('en');

    // Try to get saved language from localStorage
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
      const lang = this.languages.find(l => l.code === savedLang);
      if (lang) {
        this.selectLanguage(lang);
      }
    } else {
      this.translate.use('en');
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(language: Language) {
    this.selectedLanguage = language;
    this.isOpen = false;

    // Change the language in the entire application
    this.translate.use(language.code);

    // Save selected language to localStorage
    localStorage.setItem('selectedLanguage', language.code);

    console.log('Language changed to:', language.code);
  }

  closeDropdown() {
    this.isOpen = false;
  }
}
