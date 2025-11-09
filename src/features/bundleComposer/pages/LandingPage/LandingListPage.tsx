import { useState } from 'react';

import type { RowSelectionState } from '@tanstack/react-table';
import '../../../../app/App.css';
import mockData from '../../../../server/mocks/fixtures/plans.base.json';
import { ListingLayout } from '../../../../ui/layouts/ListingLayout';
import { Table } from '../../../../ui/table/Table';
import { TableContainer } from '../../../../ui/table/TableContainer';
import { useLandingListPageColumns } from './hooks/useLandingListPageColumns';
import LandingListPageHeader from './LandingListPageHeader';

const LandingListPage = () => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columns = useLandingListPageColumns();

  return (
    <div className="bg-slate-50">
      <ListingLayout header={<LandingListPageHeader rowSelection={rowSelection} />}>
        <div className="h-full">
          <TableContainer>
            <Table
              data={mockData}
              columns={columns}
              selectable
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
            />
          </TableContainer>
        </div>
      </ListingLayout>
    </div>
  );
};
export default LandingListPage;
