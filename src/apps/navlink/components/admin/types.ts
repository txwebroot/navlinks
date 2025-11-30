import { SiteConfig } from '@/src/shared/types';

export interface AdminTabProps {
    config: SiteConfig;
    update: (fn: (c: SiteConfig) => SiteConfig) => void;
    setConfig?: (c: SiteConfig) => void;
}
