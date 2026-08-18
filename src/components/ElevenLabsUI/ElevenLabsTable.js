import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

/**
 * ElevenLabs-style table component
 * Clean table design matching the transcriptions list
 */
export default function ElevenLabsTable({
  columns,
  rows,
  onRowClick,
  emptyMessage = 'No data available',
}) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell
                key={index}
                align={column.align || 'left'}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#999',
                  borderBottom: '1px solid #e8e8e8',
                  py: 2,
                  px: 2,
                  bgcolor: '#fafafa',
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{
                  textAlign: 'center',
                  py: 6,
                  borderBottom: 'none',
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', color: '#999' }}>
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': onRowClick
                    ? {
                        bgcolor: '#fafafa',
                      }
                    : {},
                  '&:last-child td': {
                    borderBottom: 'none',
                  },
                }}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align={column.align || 'left'}
                    sx={{
                      fontSize: '0.875rem',
                      color: '#1a1a1a',
                      borderBottom: '1px solid #f0f0f0',
                      py: 2,
                      px: 2,
                    }}
                  >
                    {column.render ? column.render(row) : row[column.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
