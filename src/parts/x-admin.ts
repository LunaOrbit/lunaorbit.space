import { LitElement, html, TemplateResult, customElement, internalProperty, query } from 'lit-element';
import { Localized } from '@lit/localize/localized-element';

import { AdminNav, DashboardPages } from './dashboard/nav';

import ExtensionSingleton from '../terra/terra-connect';

import './dashboard/settings';
import './dashboard/assets';
import './dashboard/menus';
import './dashboard/nav';
import './dashboard/home';
import './dashboard/tools';
import './dashboard/how-to';

import '../components/sign-in-terra';

import '@material/mwc-snackbar';
import '@material/mwc-fab';
import '@material/mwc-dialog';
import '@material/mwc-button';
import '@material/mwc-switch';

import { Snackbar } from '@material/mwc-snackbar';

import { SupabaseClient } from '@supabase/supabase-js'
import { retrieveSupabase } from '../luna-orbit';
import { loader } from './dashboard/home';

type AdminUser = {
  id: number;
  terraAddress: string;
  token: string;
}

/**
 * XAdmin component
 */
@customElement('x-admin')
export class XAdmin extends Localized(LitElement) {
  static APPDomain = 'http://localhost:3000';
  static LOCAL_ADMIN_KEY = 'admin-terra-address';
  static LOGGED_IN_AT_KEY = 'logged-in-at';
  static TOKEN_DURATION = 60000;

  @internalProperty()
  private _signedIn = false;

  @internalProperty()
  private _page: DashboardPages = DashboardPages.strengths;

  @internalProperty()
  private _savedAddress: string | null = null;
  
  public supabase!: SupabaseClient;

  @internalProperty()
  private _isChecking = false;

  @query('mwc-snackbar')
  public snackbar!: Snackbar;

  createRenderRoot(): this {
    return this;
  }

  constructor() {
    super();
  }

  private async _isAllowed(terraAddress: string) {
    this.supabase = retrieveSupabase();

    const queryBuilder = this.supabase.from<AdminUser>('terraLogin');
    const query = queryBuilder.select('terraAddress, token').eq('terraAddress', terraAddress);
    const allowedAddresses = (await query).data;
    const isAllowed = allowedAddresses?.length;

    if (allowedAddresses && allowedAddresses.length > 0) {
      this.supabase = retrieveSupabase(allowedAddresses[0].token);
    }

    return isAllowed;
  }

  public showSnack(message: string): void {
    this.snackbar.labelText = message;
    this.snackbar.show();
  }

  private async _loginUsing(terraAddress: string): Promise<boolean> {
    this._isChecking = true;
    if (!await this._needsLogin()) {
      this._signedIn = true;
      this._savedAddress = terraAddress;
      this._isChecking = false;
      return true;
    }

    const isAllowed = await this._isAllowed(terraAddress);
    if (isAllowed) {
      localStorage.setItem(XAdmin.LOCAL_ADMIN_KEY, terraAddress);
      localStorage.setItem(XAdmin.LOGGED_IN_AT_KEY, new Date().getTime().toString());

      this._savedAddress = terraAddress;
      this._signedIn = true;
      this._isChecking = false;
      return true;
    } else {
      localStorage.removeItem(XAdmin.LOCAL_ADMIN_KEY);
      localStorage.removeItem(XAdmin.LOGGED_IN_AT_KEY);

      alert('This address isn\'t allowed.');
      
      this._savedAddress = null;
      this._signedIn = false;
    }

    this._isChecking = false;

    return false;
  }

  private async _needsLogin() {
    const terraAddress = localStorage.getItem(XAdmin.LOCAL_ADMIN_KEY);
    const loggedAtKey = localStorage.getItem(XAdmin.LOGGED_IN_AT_KEY);
    if (!terraAddress) {
      return true;
    }

    if (loggedAtKey) {
      const isAllowed = await this._isAllowed(terraAddress);

      if (isAllowed) {
        const loggedAt = parseInt(loggedAtKey, 10);
        const isExpired = new Date(loggedAt) > new Date(loggedAt + XAdmin.TOKEN_DURATION);
  
        return isExpired;
      } else {
        return true;
      }
    }
    
    return true;
  }

  private async handleAuth(): Promise<void> {
    const savedAddress = localStorage.getItem(XAdmin.LOCAL_ADMIN_KEY);
    this._savedAddress = savedAddress;

    if (savedAddress) {
      await this._loginUsing(savedAddress);
    }
  }

  async firstUpdated(): Promise<void> {
    const orbit = document.querySelector('luna-orbit');
    this._page = orbit?.router.location.pathname.replace(AdminNav.MainPathPrefix + '/', '') as DashboardPages;

    await this.handleAuth();
  }

  async connect(): Promise<boolean> {
    const terraAdr = await ExtensionSingleton.connect();

    if (terraAdr.address) {
      await this._loginUsing(terraAdr.address);
    }
    
    return this._signedIn;
  }

  _connectButton(): TemplateResult {
    return html`
    <sign-in-terra .onLogin=${async () => {
      await this.connect();
    }}></sign-in-terra>
    `;
  }

  private _adminContent(): TemplateResult {
    return html`
        <div class="flex">
          <div class="px-4 py-6 h-screen w-full">
          ${this._isChecking ? loader() : html`
            ${this._signedIn ? html`
            ${this._pageForTitle(this._page)}
            ` : html`
            ${this._connectButton()}
            `}
          `}
          </div>
          <div class="flex flex-col items-center w-16 h-100 overflow-hidden text-indigo-300 terra-bg rounded-br-lg">
            <admin-nav .address=${this._savedAddress} .disabled=${!this._signedIn}></admin-nav>
          </div>
        </div>
    `;
  }

  render(): TemplateResult {
    return html`	
      ${this._adminContent()}
      <mwc-snackbar></mwc-snackbar>
    `;
  }

  public logout(): void {
    localStorage.removeItem(XAdmin.LOGGED_IN_AT_KEY);
    localStorage.removeItem(XAdmin.LOCAL_ADMIN_KEY);
    this._savedAddress = null;
    this._signedIn = false;
    this._isChecking = false;
  }

  private _pageForTitle(page: DashboardPages): TemplateResult {
    switch (page) {
      case DashboardPages.cockpit:
        return html`
        <website-home></website-home>
      `;
      case DashboardPages.strengths:
        return html`
        <website-home></website-home>
        `;
      case DashboardPages.howTo:
        return html`
        <website-how-to></website-how-to>
        `;
      case DashboardPages.tools:
        return html`
        <website-tools></website-tools>
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
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-admin': XAdmin;
  }
}
