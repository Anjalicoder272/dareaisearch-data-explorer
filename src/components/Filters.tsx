import { CATEGORIES, STATUSES, type Filters as FiltersType } from '../types';

interface Props {
  filters: FiltersType;
  onChange: (changes: Partial<FiltersType>) => void;
  onClear: () => void;
}

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Date (newest first)' },
  { value: 'createdAt:asc', label: 'Date (oldest first)' },
  { value: 'amount:desc', label: 'Amount (high to low)' },
  { value: 'amount:asc', label: 'Amount (low to high)' },
  { value: 'customer:asc', label: 'Customer (A to Z)' },
  { value: 'customer:desc', label: 'Customer (Z to A)' },
  { value: 'id:asc', label: 'Order ID (ascending)' },
  { value: 'id:desc', label: 'Order ID (descending)' },
];

export function Filters({ filters, onChange, onClear }: Props) {
  function toggleStatus(status: string) {
    const isSelected = filters.status.includes(status);
    const newStatus = isSelected ? filters.status.filter((s) => s !== status) : [...filters.status, status];
    onChange({ status: newStatus });
  }

  return (
    <div className="filters">
      {/* fieldset + legend tells screen readers these checkboxes belong to "Status" */}
      <fieldset className="status-filter">
        <legend className="field-label">Status</legend>
        <div className="chips">
          {STATUSES.map((status) => {
            const isSelected = filters.status.includes(status);
            return (
              <label key={status} className={isSelected ? 'chip chip--on' : 'chip'}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleStatus(status)} />
                <span aria-hidden="true">{isSelected ? '✓' : <span className={`dot dot--${status}`} />}</span>
                {status[0].toUpperCase() + status.slice(1)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="filter-row">
        <div>
          <label htmlFor="category" className="field-label">
            Category
          </label>
          <select id="category" value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="field-label">
            Sort by
          </label>
          <select
            id="sort"
            value={`${filters.sort}:${filters.dir}`}
            onChange={(e) => {
              const [sort, dir] = e.target.value.split(':');
              onChange({ sort, dir: dir as 'asc' | 'desc' });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn--ghost" onClick={onClear}>
          Clear all
        </button>
      </div>
    </div>
  );
}
