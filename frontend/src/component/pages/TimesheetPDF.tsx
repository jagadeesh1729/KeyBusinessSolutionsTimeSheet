import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Timesheet } from '../types/Holiday';

// Import the logo so Vite can process it and provide the correct path/data URI.
// import logoUrl from '../../../public/logo.png'; // Make sure you have a logo file at this path
const logoUrl = './KeyLogo.png'; // Use public path instead

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1E88E5',
    paddingBottom: 10,
  },
  companyDetails: {
    flexDirection: 'column',
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E88E5',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'column',
    width: '50%',
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    backgroundColor: '#F5F5F5',
    flexDirection: "row",
  },
  tableColHeader: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  colDate: { width: '25%' },
  colDesc: { width: '60%' },
  colHours: { width: '15%', textAlign: 'right' },
  summary: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderTopWidth: 2,
    borderTopColor: '#1E88E5',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
  },
});

interface TimesheetPDFProps {
  timesheet: Timesheet;
}

const TimesheetPDF: React.FC<TimesheetPDFProps> = ({ timesheet }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.companyDetails}>
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
          <Text style={styles.companyName}>Key Business Solutions Inc.</Text>
        </View>
        <Text style={styles.documentTitle}>Timesheet</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}><Text style={styles.label}>Employee</Text><Text style={styles.value}>{timesheet.employeeName || 'N/A'}</Text></View>
          <View style={styles.infoItem}><Text style={styles.label}>Project</Text><Text style={styles.value}>{timesheet.project?.name || 'N/A'}</Text></View>
          <View style={styles.infoItem}><Text style={styles.label}>Period</Text><Text style={styles.value}>{new Date(timesheet.periodStart).toLocaleDateString()} - {new Date(timesheet.periodEnd).toLocaleDateString()}</Text></View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Entries</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.colDate]}>Date</Text>
            <Text style={[styles.tableColHeader, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableColHeader, styles.colHours]}>Hours</Text>
          </View>
          {timesheet.dailyEntries?.flatMap(day => day.tasks.map((task, index) => (
            <View style={styles.tableRow} key={`${day.date}-${index}`}>
              <Text style={[styles.tableCol, styles.colDate]}>{index === 0 ? new Date(day.date).toLocaleDateString() : ''}</Text>
              <Text style={[styles.tableCol, styles.colDesc]}>{task.name}</Text>
              <Text style={[styles.tableCol, styles.colHours]}>{task.hours.toFixed(2)}</Text>
            </View>
          )))}
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Hours:</Text>
          <Text style={styles.summaryValue}>{timesheet.totalHours} hrs</Text>
        </View>
      </View>

    </Page>
  </Document>
);

export default TimesheetPDF;