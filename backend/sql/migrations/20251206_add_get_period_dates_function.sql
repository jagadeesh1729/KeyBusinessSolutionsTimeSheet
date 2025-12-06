-- Create the get_period_dates function that the before_timesheet_insert trigger depends on
-- This function calculates the period start and end dates based on period type

DELIMITER $$

DROP FUNCTION IF EXISTS get_period_dates$$

CREATE FUNCTION get_period_dates(
  period_type_param ENUM('weekly','bi-monthly','monthly'),
  reference_date DATE
) 
RETURNS JSON
DETERMINISTIC
BEGIN
  DECLARE period_start DATE;
  DECLARE period_end DATE;
  DECLARE result JSON;
  
  IF period_type_param = 'weekly' THEN
    -- Weekly: Monday to Sunday
    SET period_start = DATE_SUB(reference_date, INTERVAL WEEKDAY(reference_date) DAY);
    SET period_end = DATE_ADD(period_start, INTERVAL 6 DAY);
    
  ELSEIF period_type_param = 'bi-monthly' THEN
    -- Bi-monthly: 1st-15th or 16th-end of month
    IF DAY(reference_date) <= 15 THEN
      SET period_start = DATE_FORMAT(reference_date, '%Y-%m-01');
      SET period_end = DATE_FORMAT(reference_date, '%Y-%m-15');
    ELSE
      SET period_start = DATE_FORMAT(reference_date, '%Y-%m-16');
      SET period_end = LAST_DAY(reference_date);
    END IF;
    
  ELSEIF period_type_param = 'monthly' THEN
    -- Monthly: 1st to last day of month
    SET period_start = DATE_FORMAT(reference_date, '%Y-%m-01');
    SET period_end = LAST_DAY(reference_date);
    
  ELSE
    -- Default to monthly if unknown period type
    SET period_start = DATE_FORMAT(reference_date, '%Y-%m-01');
    SET period_end = LAST_DAY(reference_date);
  END IF;
  
  -- Return as JSON object
  SET result = JSON_OBJECT(
    'period_start', DATE_FORMAT(period_start, '%Y-%m-%d'),
    'period_end', DATE_FORMAT(period_end, '%Y-%m-%d')
  );
  
  RETURN result;
END$$

DELIMITER ;
