import { useState } from 'react';

import type { RowSelectionState } from '@tanstack/react-table';
import '../../../../app/App.css';
import { MOCK_PLANS_300 } from '../../../../lib/mock/models';
import { ListingLayout } from '../../../../ui/layouts/ListingLayout';
import { Table } from '../../../../ui/table/Table';
import { TableContainer } from '../../../../ui/table/TableContainer';
import { useLandingListPageColumns } from './hooks/useLandingListPageColumns';
import LandingListPageHeader from './LandingListPageHeader';

const LandingListPage = () => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columns = useLandingListPageColumns();
  const data = MOCK_PLANS_300;
  return (
    <div className="bg-slate-50">
      <ListingLayout header={<LandingListPageHeader rowSelection={rowSelection} />}>
        <div className="h-full">
          <TableContainer>
            <Table
              data={data}
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
