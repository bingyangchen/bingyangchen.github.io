import taiguOverviewPreview from "../../assets/responsive/taigu-overview-48.webp?inline";
import taiguOverviewSmall from "../../assets/responsive/taigu-overview-240.webp";
import taiguOverviewMedium from "../../assets/responsive/taigu-overview-480.webp";
import taiguOverviewLarge from "../../assets/responsive/taigu-overview-720.webp";
import taiguAllocationPreview from "../../assets/responsive/taigu-allocation-48.webp?inline";
import taiguAllocationSmall from "../../assets/responsive/taigu-allocation-240.webp";
import taiguAllocationMedium from "../../assets/responsive/taigu-allocation-480.webp";
import taiguAllocationLarge from "../../assets/responsive/taigu-allocation-720.webp";
import noadsPreview from "../../assets/responsive/noads-interface-48.webp?inline";
import noadsSmall from "../../assets/responsive/noads-interface-240.webp";
import noadsMedium from "../../assets/responsive/noads-interface-480.webp";
import noadsLarge from "../../assets/responsive/noads-interface-720.webp";
import leechaiAccountsPreview from "../../assets/responsive/leechai-accounts-48.webp?inline";
import leechaiAccountsSmall from "../../assets/responsive/leechai-accounts-240.webp";
import leechaiAccountsMedium from "../../assets/responsive/leechai-accounts-480.webp";
import leechaiAccountsLarge from "../../assets/responsive/leechai-accounts-720.webp";
import leechaiSettingsPreview from "../../assets/responsive/leechai-settings-48.webp?inline";
import leechaiSettingsSmall from "../../assets/responsive/leechai-settings-240.webp";
import leechaiSettingsMedium from "../../assets/responsive/leechai-settings-480.webp";
import leechaiSettingsLarge from "../../assets/responsive/leechai-settings-720.webp";

export interface ArtworkImage {
  preview: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

export const taiguOverview: ArtworkImage = {
  preview: taiguOverviewPreview,
  src: taiguOverviewSmall,
  srcSet: `${taiguOverviewSmall} 240w, ${taiguOverviewMedium} 480w, ${taiguOverviewLarge} 720w`,
  width: 885,
  height: 1777,
};
export const taiguAllocation: ArtworkImage = {
  preview: taiguAllocationPreview,
  src: taiguAllocationSmall,
  srcSet: `${taiguAllocationSmall} 240w, ${taiguAllocationMedium} 480w, ${taiguAllocationLarge} 720w`,
  width: 885,
  height: 1777,
};
export const noadsInterface: ArtworkImage = {
  preview: noadsPreview,
  src: noadsSmall,
  srcSet: `${noadsSmall} 240w, ${noadsMedium} 480w, ${noadsLarge} 720w`,
  width: 1200,
  height: 2538,
};
export const leechaiAccounts: ArtworkImage = {
  preview: leechaiAccountsPreview,
  src: leechaiAccountsSmall,
  srcSet: `${leechaiAccountsSmall} 240w, ${leechaiAccountsMedium} 480w, ${leechaiAccountsLarge} 720w`,
  width: 885,
  height: 1777,
};
export const leechaiSettings: ArtworkImage = {
  preview: leechaiSettingsPreview,
  src: leechaiSettingsSmall,
  srcSet: `${leechaiSettingsSmall} 240w, ${leechaiSettingsMedium} 480w, ${leechaiSettingsLarge} 720w`,
  width: 885,
  height: 1777,
};
