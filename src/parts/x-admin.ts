import {LitElement, html, TemplateResult, customElement, internalProperty} from 'lit-element';
import {Localized} from '@lit/localize/localized-element';
import { msg } from '@lit/localize';

import { authenticate, getPerson, userSession } from '../auth';
import { UserSession } from '@stacks/auth';
import { Person } from '@stacks/profile';

import EditorJS, { LogLevels } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Image from '@editorjs/simple-image'; 
import RawTool from '@editorjs/raw'; 
import Link from '@editorjs/link'; 
import Checklist from '@editorjs/checklist'; 
import NestedList from '@editorjs/nested-list';
import Marker from '@editorjs/marker';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import AttachesTool from '@editorjs/attaches';

import './dashboard/settings';
import './dashboard/assets';
import './dashboard/translate';

import { IXliffSource, IXliffTarget, XliffParser } from '@vtabary/xliff2js';

// import ENGTranslation from '../assets/xliff/en.xlf?raw';
import FRTranslation from '../assets/xliff/fr.xlf?raw';
import { getFile, putFile } from '../storage';

enum DashboardPages {
  cockpit = '/cockpit',
  pages = 'pages',
  settings = 'settings',
  assets = 'assets',
  translate = 'translate',
  menus = 'menus',
}

/**
 * XAdmin component
 *
 */
@customElement('x-admin')
export class XAdmin extends Localized(LitElement) {
  static APPDomain = 'http://localhost:3000';
  static RedirectURI = 'http://localhost:3000/panel';
  static ManifestURI = 'http://localhost:3000/manifest.json';
  static MainPathPrefix = '/cockpit'

  @internalProperty()
  private _signedIn = false;
  private _userSession: UserSession | null = userSession;

  @internalProperty()
  private _person: Person | null = null;

  @internalProperty()
  private _page: DashboardPages = DashboardPages.pages;

  @internalProperty()
  private _strings: { source: IXliffSource, target: IXliffTarget }[] = [];

  private _editor: EditorJS | null = null;

  createRenderRoot(): this {
    return this;
  }

  async firstUpdated(): Promise<void> {
    const orbit = document.querySelector('luna-orbit');
    this._page = orbit?.router.location.pathname.replace(XAdmin.MainPathPrefix + '/', '') as DashboardPages;

    if (this._userSession?.isSignInPending()) {
      const responseToken = localStorage.getItem('lunaorbit-response-token');
      if (responseToken) {
        await this._userSession.handlePendingSignIn(responseToken);
      } else {
        await this._userSession.handlePendingSignIn();
      }
    }

    if (this._userSession?.isUserSignedIn()) {
      this._person = getPerson();
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

    if (this._page === DashboardPages.pages) {
      await this.updateComplete;

      const editorHolder = this.querySelector('#holder') as HTMLDivElement;
      if (editorHolder) {
        const savedTest = await getFile('test.json', {
          decrypt: false
        });

        const data = JSON.parse(savedTest as string);

        this._editor = new EditorJS({
          holder: editorHolder,
          tools: { 
            header: {
              class: Header,
              inlineToolbar: ['link'] 
            }, 
            list: { 
              class: NestedList, 
              inlineToolbar: true 
            },
            image: {
              class: Image,
            },
            raw: {
              class: RawTool
            },
            link: {
              class: Link,
            },
            checklist: {
              class: Checklist
            },
            marker: {
              class: Marker,
              shortcut: 'CMD+SHIFT+M',
            },
            quote: {
              class: Quote,
              inlineToolbar: true,
              shortcut: 'CMD+SHIFT+O',
              config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: 'Quote\'s author',
              },
            },
            attaches: {
              class: AttachesTool,
              inlineToolbar: true,
              config: {
                endpoint: 'http://localhost:8008/uploadFile'
              }
            },
            delimiter: Delimiter,
          },
          autofocus: true,
          placeholder: msg('Let`s write an awesome story!'),
          logLevel: 'VERBOSE' as LogLevels,
          onReady: () => {
            // console.log('Editor.js is ready to work!');
          },
          onChange: () => {
            // console.log('Now I know that Editor\'s content changed!');
          },
          data
        });
      }
    }
  }

  connect(): void {
    authenticate(() => {
      console.warn('canceled');
      this._signedIn = false;
    }, (payload) => {
      this._userSession = payload.userSession;
      this._person = getPerson();

      sessionStorage.setItem('lunaorbit-response-token', this._userSession.getAuthResponseToken());
      this._signedIn = true;
    });
  }

  _connectButton(): TemplateResult {
    return html`
    <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <button @click=${() => {
            this.connect();
          }} class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white terra-bg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </span>
            ${msg('Sign in')}
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
          <div class="flex flex-col items-center mt-3">
            ${this._person ? html`
              <img class="h-10 w-10 bg-white rounded-full" src="https://avatars.dicebear.com/api/bottts/${this._person?.profile().stxAddress.mainnet}.svg" />
            ` : html``}
            <a class="flex items-center justify-center w-12 h-12 mt-2 rounded ${this._page === DashboardPages.pages ? 'text-indigo-100 bg-blue-700' : 'hover:bg-blue-700 hover:text-white'}" href="${XAdmin.MainPathPrefix}/${DashboardPages.pages}" title="${msg('Pages')}">
              <svg class="w-6 h-6 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </a>
            <a class="flex items-center justify-center w-12 h-12 mt-2 rounded ${this._page === DashboardPages.menus ? 'text-indigo-100 bg-blue-700' : 'hover:bg-blue-700 hover:text-white'}" href="${XAdmin.MainPathPrefix}/${DashboardPages.menus}" title="${msg('Menus')}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </a>
          </div>
          <a class="flex items-center justify-center w-12 h-12 mt-2 rounded ${this._page === DashboardPages.translate ? 'text-indigo-100 bg-blue-700' : 'hover:bg-blue-700 hover:text-white'}" href="${XAdmin.MainPathPrefix}/${DashboardPages.translate}" title="${msg('Translate')}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </a>
          <a class="flex items-center justify-center w-12 h-12 mt-2 rounded ${this._page === DashboardPages.assets ? 'text-indigo-100 bg-blue-700' : 'hover:bg-blue-700 hover:text-white'}" href="${XAdmin.MainPathPrefix}/${DashboardPages.assets}" title="${msg('Assets')}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </a>
          <a class="flex items-center justify-center w-12 h-12 mt-2 rounded ${this._page === DashboardPages.settings ? 'text-indigo-100 bg-blue-700' : 'hover:bg-blue-700 hover:text-white'}" href="${XAdmin.MainPathPrefix}/${DashboardPages.settings}" title="${msg('Settings')}">
            <svg class="w-6 h-6 stroke-current"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </a>
          <a title="${msg('Logout')}" @click=${() => {
              this._userSession?.signUserOut();
              this._signedIn = false;
            }} class="flex items-center justify-center w-12 h-12 mt-2 rounded cursor-pointer hover:bg-blue-700 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </a>
        </div>
        <div class="px-4 py-6 h-screen w-full">
          ${this._pageForTitle(this._page)}
        </div>
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
        <div class="flex justify-between ml-4 mb-4 pb-6">
          <h1 class="text-xl">
            ${msg('Pages')}
          </h1>
          <div class="flex justify-between gap-2">
            <div class="relative">
              <select
                class="rounded border appearance-none border-gray-300 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 text-base pl-3 pr-7"
              >
                <option>Staking</option>
                <option>How to</option>
                <option>Tools</option>
                <option>Contact</option>
              </select>
              <span
                class="absolute right-0 top-0 h-full w-10 text-center text-gray-600 pointer-events-none flex items-center justify-center"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </span>
            </div>
            <button @click=${async () => {
              const outputData = await this._editor?.save();
              const savedTest = await putFile('test.json', JSON.stringify(outputData), {
                contentType: 'text/html',
                encrypt: false,
                dangerouslyIgnoreEtag: false
              });
          
              console.warn(savedTest);
            }} class="bg-blue-500 hover:terra-bg text-white py-2 px-4 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
            <button class="bg-blue-500 hover:terra-bg text-white py-2 px-4 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button class="bg-blue-500 hover:terra-bg text-white py-2 px-4 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div id="holder" class="w-full p-4 border-4 rounded-sm"></div>
        `;
      case DashboardPages.settings:
        return html`
        <website-setting></website-setting>
        `;
      case DashboardPages.menus:
        return html`
        <h1 class="text-xl ml-4 mb-4 pb-6">
          ${msg('Menus')}
        </h1>
        <div class="m-4">
          TODO : Form to manage website menus
        </div>
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
