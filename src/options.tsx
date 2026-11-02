import { OptionsApp } from './app/OptionsApp';
import { mountExtensionPage } from './mountExtensionPage';

document.body.classList.add('options-page');

mountExtensionPage(<OptionsApp />);
