import React, { useState } from 'react';
import {
  Sparkles,
  HardDrive,
  Globe,
  CheckCircle2,
  ArrowRight,
  Clock,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AdditionalServiceItem, AdditionalServiceModal } from './AdditionalServiceModal';
import type { Tenant } from '../types';

interface AdditionalServicesViewProps {
  currentTenant?: Tenant;
}

export const AdditionalServicesView: React.FC<AdditionalServicesViewProps> = ({ currentTenant }) => {
  const { institution } = useAuth();
  const { t, tArray, tRaw, language } = useLanguage();
  const [selectedService, setSelectedService] = useState<AdditionalServiceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const activeServices = institution?.subscription?.additionalServices || [];

  const catalog: AdditionalServiceItem[] = [
    {
      id: 'prod_VAwC3xtg7ekOxe',
      name: t('additionalServices.items.storageMeet.name'),
      badge: t('additionalServices.items.storageMeet.badge'),
      category: 'STORAGE_MEET',
      unitPriceUsd: 299,
      priceSuffix: `$ 299,00 USD / ${t('additionalServices.items.storageMeet.unitNoun').toLowerCase()}`,
      unitLabel: t('additionalServices.items.storageMeet.unitNoun'),
      unitNoun: t('additionalServices.items.storageMeet.unitNoun'),
      defaultQuantity: 1,
      minQuantity: 1,
      maxQuantity: 20,
      quantityStep: 1,
      description: t('additionalServices.items.storageMeet.description'),
      longDescription: t('additionalServices.items.storageMeet.longDescription'),
      appliesToAllActive: true,
      features: tArray('additionalServices.items.storageMeet.features', []),
      specs: tRaw<{ label: string; value: string }[]>('additionalServices.items.storageMeet.specs', []),
      icon: HardDrive,
    },
    {
      id: 'prod_UsDMgccT772IQB',
      name: t('additionalServices.items.domain.name'),
      badge: t('additionalServices.items.domain.badge'),
      category: 'DOMAIN',
      unitPriceUsd: 25,
      priceSuffix: `$ 25,00 USD / ${t('additionalServices.items.domain.unitNoun').toLowerCase()}`,
      unitLabel: t('additionalServices.items.domain.unitNoun'),
      unitNoun: t('additionalServices.items.domain.unitNoun'),
      defaultQuantity: 1,
      minQuantity: 1,
      maxQuantity: 50,
      quantityStep: 1,
      description: t('additionalServices.items.domain.description'),
      longDescription: t('additionalServices.items.domain.longDescription'),
      appliesToAllActive: false,
      features: tArray('additionalServices.items.domain.features', []),
      icon: Globe,
    },
    {
      id: 'prod_VAwGEVkbD2LFvp',
      name: t('additionalServices.items.geminiAi.name'),
      badge: t('additionalServices.items.geminiAi.badge'),
      category: 'AI_GEMINI',
      unitPriceUsd: 25,
      priceSuffix: `$ 25,00 USD / ${t('additionalServices.items.geminiAi.unitNoun').toLowerCase()}`,
      unitLabel: t('additionalServices.items.geminiAi.unitNoun'),
      unitNoun: t('additionalServices.items.geminiAi.unitNoun'),
      defaultQuantity: 5,
      minQuantity: 1,
      maxQuantity: 500,
      quantityStep: 1,
      description: t('additionalServices.items.geminiAi.description'),
      longDescription: t('additionalServices.items.geminiAi.longDescription'),
      appliesToAllActive: false,
      features: tArray('additionalServices.items.geminiAi.features', []),
      specs: tRaw<{ label: string; value: string }[]>('additionalServices.items.geminiAi.specs', []),
      icon: Sparkles,
    },
  ];

  const handleOpenServiceModal = (service: AdditionalServiceItem) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const localeCode = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#163300] to-[#0A1A00] rounded-3xl p-8 text-white relative overflow-hidden border border-[#9FE870]/20 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#9FE870]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9FE870]/20 border border-[#9FE870]/30 text-[#9FE870] text-xs font-bold font-['Outfit'] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {t('additionalServices.catalogBadge')}
          </div>
          <h1 className="text-3xl font-black font-['Outfit'] tracking-tight text-white sm:text-4xl">
            {t('additionalServices.title')}
          </h1>
        </div>
      </div>

      {/* Currently Contracted Services (if any) */}
      {activeServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#163300]" />
              <h2 className="text-lg font-bold text-[#0E0F0C] font-['Outfit']">
                {t('additionalServices.contractedTitle')}
              </h2>
            </div>
            <span className="text-xs font-bold text-[#163300] bg-[#E8F7DC] px-3 py-1 rounded-full border border-[#9FE870]/40">
              {t('additionalServices.activeCount', { count: activeServices.length })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((act) => (
              <div
                key={act.id}
                className="p-5 bg-white rounded-2xl border border-[#E2E6DF] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#163300] bg-[#E8F7DC] px-2 py-0.5 rounded-full border border-[#9FE870]/40 font-['Outfit']">
                      {t('additionalServices.activeBadge')}
                    </span>
                    <span className="text-xs text-[#5E605D] flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {act.activatedAt ? new Date(act.activatedAt).toLocaleDateString(localeCode) : t('additionalServices.activeBadge')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0E0F0C] font-['Outfit']">
                    {act.name}
                  </h3>
                  <p className="text-xs text-[#5E605D] line-clamp-2">
                    {act.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E6DF] flex items-center justify-between text-xs">
                  <span className="text-[#5E605D] font-medium">
                    {t('additionalServices.quantityLabel')}{' '}
                    <strong className="text-[#0E0F0C]">
                      {t('additionalServices.quantityUnit', { qty: act.quantity || 1 })}
                    </strong>
                  </span>
                  {act.unitPriceUsd && (
                    <span className="font-bold text-[#163300]">
                      $ {(act.unitPriceUsd * (act.quantity || 1)).toFixed(2)} USD/{language === 'pt' ? 'mês' : language === 'es' ? 'mes' : 'mo'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {catalog.map((service) => {
            const IconComponent = service.icon;

            return (
              <div
                key={service.id}
                id={`addon-card-${service.id}`}
                onClick={() => handleOpenServiceModal(service)}
                className="group bg-white rounded-3xl border border-[#E2E6DF] hover:border-[#9FE870] shadow-xs hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer relative overflow-hidden active:scale-99"
              >
                {/* Top decorative accent on hover */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#9FE870] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="space-y-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#F4F5F0] group-hover:bg-[#E8F7DC] border border-[#E2E6DF] group-hover:border-[#9FE870]/60 flex items-center justify-center text-[#163300] transition-colors shadow-2xs shrink-0">
                      <IconComponent className="w-7 h-7 stroke-[2.2]" />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#E8F7DC] text-[#163300] font-['Outfit'] border border-[#9FE870]/40 block mb-1">
                        {service.badge}
                      </span>
                      {service.appliesToAllActive && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {t('additionalServices.appliesToAll')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Short Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#0E0F0C] font-['Outfit'] group-hover:text-[#163300] transition-colors leading-tight">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#5E605D] leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Feature Highlights preview */}
                  <div className="space-y-2.5 pt-2 border-t border-[#E2E6DF]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#5E605D] font-['Outfit'] block">
                      {t('additionalServices.benefitsTitle')}
                    </span>
                    <ul className="space-y-2">
                      {(Array.isArray(service.features) ? service.features : []).slice(0, 4).map((feat, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-[#0E0F0C] flex items-start gap-2 font-medium leading-snug"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#163300] shrink-0 mt-0.5" />
                          <span className="break-words">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Bottom: Price + Action Button */}
                <div className="pt-5 mt-6 border-t border-[#E2E6DF] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#5E605D] block">{t('additionalServices.investmentLabel')}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-[#163300] font-['Outfit']">
                        $ {service.unitPriceUsd.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-bold text-[#5E605D]">
                        {t('additionalServices.usdPerUnit', { unit: service.unitNoun.toLowerCase() })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#163300] text-[#9FE870] group-hover:bg-[#9FE870] group-hover:text-[#163300] text-xs font-black transition-all shadow-xs group-hover:shadow-md cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span className="whitespace-nowrap">{t('additionalServices.contractBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      {/* Service Details & Contracting Modal */}
      <AdditionalServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        service={selectedService}
        currentTenant={currentTenant}
      />
    </div>
  );
};

