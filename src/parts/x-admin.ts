import { LitElement, html, TemplateResult, customElement, internalProperty } from 'lit-element';
import { Localized } from '@lit/localize/localized-element';
import { msg } from '@lit/localize';
import { Person } from '@stacks/profile';

import { IXliffSource, IXliffTarget, XliffParser } from '@vtabary/xliff2js';
import FRTranslation from '../assets/xliff/fr.xlf?raw';

import { AdminNav, DashboardPages } from './dashboard/nav';

import ExtensionSingleton from '../terra/terra-connect';

import './dashboard/settings';
import './dashboard/assets';
import './dashboard/translate';
import './dashboard/pages';
import './dashboard/menus';
import './dashboard/nav';

/**
 * XAdmin component
 */
@customElement('x-admin')
export class XAdmin extends Localized(LitElement) {
  static APPDomain = 'http://localhost:3000';
  static RedirectURI = 'http://localhost:3000/panel';
  static ManifestURI = 'http://localhost:3000/manifest.json';

  @internalProperty()
  private _signedIn = false;

  @internalProperty()
  private _person: Person | null = null;

  @internalProperty()
  private _page: DashboardPages = DashboardPages.pages;

  @internalProperty()
  private _strings: { source: IXliffSource, target: IXliffTarget }[] = [];

  createRenderRoot(): this {
    return this;
  }

  private async handleAuth(): Promise<void> {
    if (localStorage.getItem('terra-address')) {
      this._signedIn = true;
    } else {
      this._signedIn = false;
    }

    if (this._page === DashboardPages.translate) {
      const parser = new XliffParser();

      // const english = parser.parse(ENGTranslation)?.children[0].children;
      const french = parser.parse(FRTranslation)?.children[0].children[0].children;

      if (french) {
        for (const transUnits of french) {
          const [source, target] = transUnits.children;
          const sourceDescriptor = source as IXliffSource;
          const targetDescriptor = target as IXliffTarget;
          this._strings.push({
            source: sourceDescriptor,
            target: targetDescriptor,
          });
        }
      }
    }
  }

  async firstUpdated(): Promise<void> {
    const orbit = document.querySelector('luna-orbit');
    this._page = orbit?.router.location.pathname.replace(AdminNav.MainPathPrefix + '/', '') as DashboardPages;

    await this.handleAuth();
  }

  async connect(): Promise<boolean> {
    const terraAdr = await ExtensionSingleton.connect();
    if (terraAdr.address === 'terra103ftmy75ty3wv5jnvh6jr962gv60u3tgsxc4pj') {
      this._signedIn = true;
      localStorage.setItem('terra-address', terraAdr.address);
    } else {
      this._signedIn = false;
    }
    
    return this._signedIn;
  }

  _connectButton(): TemplateResult {
    return html`
    <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <button @click=${async () => {
            await this.connect();
          }} class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white terra-bg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg class="h-6 w-6" enable-background="new 0 0 935.7 947.3" version="1.1" viewBox="0 0 935.7 947.3" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
                <style type="text/css">
                    .st0{fill:#5492F6;}
                    .st1{fill:#0E3CA5;}
                </style>
              <path class="st0" d="m488.1 559.6c-4.9-3.7-11-4.9-16.6-7.3-19.3-8.4-38.5-17.2-57.2-27-22.8-12-44.7-25.2-65.2-40.8-21.5-16.4-41.2-34.7-56-57.7-11.1-17.2-18.6-35.7-20.3-56.4-1.5-18.9 2.6-36.5 10.6-53.5 0.8-1.8 1.7-3.6 2.6-5.4 7-11.6 14.6-22.6 23.9-32.5 28.7-30.7 63.6-52.9 100.7-71.7 52.3-26.4 107.4-45.4 164.7-57.8 34.8-7.5 69.8-13.6 105.7-10.1 15.6 1.5 30.9 4.5 45.3 10.8 1.5 0.7 2.9 1.6 4.7 1.2l-0.1-0.1c0.3 0.4 0.6 0.7 0.9 1.1 4.7 2.4 8.7 5.9 12.7 9.4 31.9 28.2 58.9 60.6 81 97 26 43 43.7 89.4 53.1 138.7 3.5 18.3 5.6 36.9 6.5 55.6 0.7 13.1 1 26.3 0.5 39.4-1.9 46.8-11.1 92.1-28 135.9-2.3 5.9-8 7.7-13.1 9.8-6 2.4-12.2 4-18.8 4.3-2.6 0.1-5.4-0.1-7.6 1.8-1.5-1.6-3.4-1-5.2-1-6.1-0.2-12.3-0.3-18.4-0.7-28.6-1.9-56.5-7.5-84.3-14.1-69.7-16.6-137.6-39.1-204.9-63.7-5.4-1.8-10.9-5-17.2-5.2z"/>
              <path class="st0" d="m71.9 331.3c9.5 11.8 18.5 23.1 27.7 34.3 20.3 24.5 41.8 48 60.6 73.7 40.7 55.9 79.1 113.3 109.4 175.7 17.1 35.2 29.2 72.2 34.1 111.1 2.5 19.9 1.6 39.9 0.9 59.9-0.5 15.1-1.5 30.2-2.5 45.3-0.4 6.3-1.5 12.5-2.1 18.8-0.5 4.7-2.9 6.1-7.4 5.4-7.8-1.2-15.1-4-22.1-7.5-27.4-13.7-52.4-31-75.7-50.8-45.6-38.7-81.4-84.9-107.4-138.8-20.9-43-34-88.4-39-136-6.8-64 0.3-126.5 21.9-187.2 0.4-1.1 0.9-2.1 1.6-3.9z"/>
              <path class="st1" d="m488.1 559.6c6.3 0.2 11.8 3.4 17.5 5.5 67.3 24.6 135.1 47.1 204.9 63.7 27.8 6.6 55.7 12.2 84.3 14.1 6.1 0.4 12.3 0.5 18.4 0.7 1.8 0.1 3.7-0.6 5.2 1-5.3 13.3-12.1 25.7-19.1 38.1-2.7 2.1-6.2 2.3-9.3 3.4-41.6 14.5-81.5 32.7-119.1 55.6-23.2 14.2-45.4 29.8-62.7 51.2-9 11.2-16.1 23.2-15.4 38.5 0.2 4.7 2.9 8.5 3.4 12.9-10.2 3.4-20.6 6.4-31 9.5-11.9 3.6-23.3 2.3-34.6-1.9-21.5-7.9-39.6-20.9-56.2-36.3-29.6-27.4-51.5-59.7-64.5-98.1-13.3-39.3-5.1-74.3 20-106.2 15-19.2 33.6-34.5 53.5-48.3 1.5-1 3.1-2.2 4.7-3.4z"/>
              <path class="st1" d="m731.1 151.7c-1.8 0.4-3.2-0.6-4.7-1.2-14.5-6.3-29.7-9.3-45.3-10.8-35.9-3.5-70.9 2.6-105.7 10.1-57.4 12.3-112.4 31.3-164.7 57.7-37.2 18.8-72 40.9-100.7 71.7-9.2 9.9-16.9 20.9-23.9 32.5-19-13-36.6-27.5-49.9-46.5-2.8-3.9-5.5-7.9-7.3-12.4 11.4-6.1 23-11.9 34.3-18.2 25.6-14.4 49.7-30.9 69.9-52.5 11-11.8 20.3-24.8 23.4-41 3.4-18.3-1.5-30.4-20.3-37.3-3.7-1.4-7.9-1.3-11.4-3.3 29-13.3 59.4-22.2 90.7-27.8 40.1-7.2 80.4-8.1 120.8-2.9 72.2 9.4 137.1 36.6 194.5 81.4 0.1 0.1 0.2 0.3 0.3 0.5z"/>
              <path class="st0" d="m324.7 100.5c3.5 2 7.6 1.9 11.4 3.3 18.8 6.9 23.8 19 20.3 37.3-3 16.3-12.4 29.2-23.4 41-20.2 21.7-44.3 38.1-69.9 52.5-11.3 6.3-22.9 12.2-34.3 18.2-12.9 5.3-25.7 10.8-38.8 15.8-26 9.9-52.4 18.5-80 22.4-5.2 0.8-10.5 1.3-15.9 0.9-4.7-0.3-4.8-1.9-3-5.5 9.7-18.8 20.6-36.9 32.9-54.1 33.2-46.3 74.1-84.4 122.7-114.2 22.4-13.8 46.6-19.9 72.9-17.6 1.8 0.2 3.5 0 5.1 0z"/>
              <path class="st0" d="m596.1 844.4c-0.5-4.4-3.2-8.2-3.4-12.9-0.7-15.3 6.4-27.3 15.4-38.5 17.2-21.5 39.4-37.1 62.7-51.2 37.6-22.9 77.5-41.1 119.1-55.6 3.1-1.1 6.6-1.3 9.3-3.4 7.9-1.8 15.8-3.7 23.8-5.5 1.3-0.3 2.6-0.5 3.9-0.6 5.3-0.2 7.2 2.5 4.6 7.2-3.4 6.1-7 12.1-10.8 18-40.3 62.4-92.9 111.5-158.5 146.4-14.9 7.9-31 11-47.8 6.8-5.9-1.5-11.2-4.2-15.4-8.7-0.9-1-1.6-1.9-2.9-2z"/>
              <path class="st1" d="m731.9 152.7c-0.3-0.4-0.6-0.7-0.9-1.1 0.6 0.1 1 0.4 0.9 1.1z"/>
            </svg>

            </span>
            ${msg('Sign in with Terra')}
          </button>
        </div>
      </div>
    </div>
    `;
  }

  private _adminNav(): TemplateResult {
    return html`
        <div class="flex">
          <div class="flex flex-col items-center w-16 h-100 overflow-hidden text-indigo-300 terra-bg">
            <admin-nav .person=${this._person} .page=${this._page}></admin-nav>
          </div>
          <div class="px-4 py-6 h-screen w-full">
            ${this._pageForTitle(this._page)}
          </div>
        </div>
    `;
  }

  render(): TemplateResult {
    return html`	
    ${this._signedIn ? html`
      ${this._adminNav()}
    ` : html`
      ${this._connectButton()}
    `}
    `;
  }

  public logout(): void {
    localStorage.removeItem('terra-address');
    this._signedIn = false;
  }

  private _pageForTitle(page: DashboardPages): TemplateResult {
    switch (page) {
      case DashboardPages.cockpit:
        return html`
        <div class="flex justify-between ml-4 mb-4 pb-6">
          <h1 class="text-xl">
            ${msg('Home')}
          </h1>
        </div>
        `;
      case DashboardPages.pages:
        return html`
        <website-pages></website-pages>
        `;
      case DashboardPages.settings:
        return html`
        <website-setting></website-setting>
        `;
      case DashboardPages.menus:
        return html`
        <admin-menu></admin-menu>
        `;
      case DashboardPages.assets:
        return html`
        <website-assets></website-assets>
        `;
      case DashboardPages.translate:
        return html`
        <website-translate .strings=${this._strings}></website-translate>
        `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-admin': XAdmin;
  }
}
