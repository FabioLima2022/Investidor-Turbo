import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { listAssets, AssetRecord } from '@/services/assets';

const addAssetSchema = z.object({
  assetId: z.string().min(1, 'Selecione um ativo'),
  allocation: z.number().min(0).max(100),
  quantity: z.number().min(0),
  averagePrice: z.number().min(0),
});

type AddAssetFormData = z.infer<typeof addAssetSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddAssetFormData) => void;
}

export function AddAssetModal({ isOpen, onClose, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddAssetFormData>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      allocation: 5,
      quantity: 0,
      averagePrice: 0,
    },
  });
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const items = await listAssets(200);
        setAssets(items);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
      load();
      reset({ allocation: 5, quantity: 0, averagePrice: 0 });
    }
  }, [isOpen, reset]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  Adicionar Ativo
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="assetId" className="block text-sm font-medium text-gray-700">Ativo</label>
                    <select id="assetId" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" {...register('assetId')}>
                      <option value="">Selecione um ativo</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.symbol} • {a.name}</option>
                      ))}
                    </select>
                    {errors.assetId && <p className="mt-1 text-sm text-red-600">{errors.assetId.message}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="allocation" className="block text-sm font-medium text-gray-700">Alocação (%)</label>
                      <input type="number" id="allocation" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" {...register('allocation', { valueAsNumber: true })} />
                      {errors.allocation && <p className="mt-1 text-sm text-red-600">{errors.allocation.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantidade</label>
                      <input type="number" id="quantity" step="0.0001" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" {...register('quantity', { valueAsNumber: true })} />
                      {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="averagePrice" className="block text-sm font-medium text-gray-700">Preço Médio</label>
                      <input type="number" id="averagePrice" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" {...register('averagePrice', { valueAsNumber: true })} />
                      {errors.averagePrice && <p className="mt-1 text-sm text-red-600">{errors.averagePrice.message}</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" onClick={onClose}>
                      Cancelar
                    </button>
                    <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" disabled={loading}>
                      Adicionar
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
