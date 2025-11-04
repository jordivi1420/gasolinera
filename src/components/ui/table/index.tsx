import { ReactNode, HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

// Props for Table
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  className?: string;
}

// Header
interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// Body
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// Row
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

// Cell
interface TableCellProps
  extends Omit<ThHTMLAttributes<HTMLTableCellElement>, "scope">,
    TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  isHeader?: boolean; // <th> si true
  className?: string;
  scope?: "col" | "row"; // para accesibilidad
}

const Table: React.FC<TableProps> = ({ children, className = "", ...rest }) => {
  return (
    <table
      className={`min-w-full text-left border-collapse ${className}`}
      {...rest}
    >
      {children}
    </table>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "", ...rest }) => {
  return <thead className={className} {...rest}>{children}</thead>;
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = "", ...rest }) => {
  return <tbody className={className} {...rest}>{children}</tbody>;
};

const TableRow: React.FC<TableRowProps> = ({ children, className = "", ...rest }) => {
  return <tr className={className} {...rest}>{children}</tr>;
};

const TableCell: React.FC<TableCellProps> = ({ children, isHeader = false, className = "", scope, ...rest }) => {
  if (isHeader) {
    return (
      <th
        className={className}
        scope={scope ?? "col"}
        {...(rest as ThHTMLAttributes<HTMLTableCellElement>)}
      >
        {children}
      </th>
    );
  }
  return (
    <td className={className} {...(rest as TdHTMLAttributes<HTMLTableCellElement>)}>
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
