import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const {
    data: paginatedTransactions,
    hasMoreTransactions,
    ...paginatedTransactionsUtils
  } = usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  // const [hasMoreTransactions, setHasMoreTransactions] = useState(true);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();

    await employeeUtils.fetchAll();
    await paginatedTransactionsUtils.fetchAll();

    setIsLoading(false);
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      // Check whether the employeeId is empty or a special value, and if so, call loadAllTransactions to load all transactions
      if (!employeeId || employeeId === EMPTY_EMPLOYEE.id) {
        await loadAllTransactions();
        setSelectedEmployeeId(null); // Resetting since it's loading all transactions
      } else {
        paginatedTransactionsUtils.invalidateData();
        await transactionsByEmployeeUtils.fetchById(employeeId);
        setSelectedEmployeeId(employeeId); // Set the selected employee ID
      }
    },
    [
      paginatedTransactionsUtils,
      transactionsByEmployeeUtils,
      loadAllTransactions,
    ]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="KaizntreeBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              setSelectedEmployeeId(null); // Reset when no selection
              return;
            }

            await loadTransactionsByEmployee(newValue.id);
          }}
        />

        <div className="KaizntreeBreak--l" />

        <div className="KaizntreeGrid">
          <Transactions transactions={transactions} />

          {transactions !== null &&
            selectedEmployeeId === null &&
            hasMoreTransactions && (
              <button
                className="KaizntreeButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await loadAllTransactions();
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  );
}
