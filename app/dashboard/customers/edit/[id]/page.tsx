import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers, fetchCustomerById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import EditFormCustomer from '@/app/ui/customers/edit-form';

export const metadata: Metadata = {
  title: 'Edit customer',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const customer = await fetchCustomerById(id);
  // const [invoice, customers] = await Promise.all([
  //     fetchInvoiceById(id),
  //     fetchCustomers(),
  // ]);

  // if (!invoice) {
  //     notFound();
  // }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Edit Customer',
            href: `/dashboard/customers/edit/${id}`,
            active: true,
          },
        ]}
      />
      <EditFormCustomer customer={customer}/>
    </main>
  );
}
