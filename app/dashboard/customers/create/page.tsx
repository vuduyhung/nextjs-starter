import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import CreateFormCustomer from '@/app/ui/customers/create-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create invoice',
};

export default async function page() {
  
  return (
    <main>
        <Breadcrumbs
            breadcrumbs={[
                { label: 'Customers', href: '/dashboard/customers' },
                {
                    label: 'Create Customer',
                    href: '/dashboard/customers/create',
                    active: true,
                },
            ]}
        />
        <CreateFormCustomer />
    </main>
);
}
