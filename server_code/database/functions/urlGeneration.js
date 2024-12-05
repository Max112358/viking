// database/functions/urlGeneration.js
module.exports = async (client) => {
  try {
    // Base URL generation function
    await client.query(`
          CREATE OR REPLACE FUNCTION generate_unique_url_id(table_name text, column_name text)
          RETURNS char(8) AS $$
          DECLARE
              new_id char(8);
              done bool;
          BEGIN
              done := false;
              WHILE NOT done LOOP
                  new_id := array_to_string(ARRAY(
                      SELECT chr(((CASE WHEN r < 26 THEN 65 
                                      WHEN r < 52 THEN 97
                                      ELSE 48 END) + (CASE WHEN r < 26 THEN r
                                                         WHEN r < 52 THEN (r-26)
                                                         ELSE (r-52) END))::integer)
                      FROM (
                          SELECT floor(random()*62)::integer AS r
                          FROM generate_series(1,8)
                      ) AS gen
                  ), '');
                  
                  EXECUTE format('SELECT NOT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
                  INTO done
                  USING new_id;
              END LOOP;
              
              RETURN new_id;
          END;
          $$ LANGUAGE plpgsql;
      `);

    // Channel URL ID trigger function
    await client.query(`
          CREATE OR REPLACE FUNCTION set_channel_url_id()
          RETURNS TRIGGER AS $$
          BEGIN
              IF NEW.url_id IS NULL THEN
                  NEW.url_id := generate_unique_url_id('channels', 'url_id');
              END IF;
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
      `);

    // Thread URL ID trigger function
    await client.query(`
          CREATE OR REPLACE FUNCTION set_thread_url_id()
          RETURNS TRIGGER AS $$
          BEGIN
              IF NEW.url_id IS NULL THEN
                  NEW.url_id := generate_unique_url_id('threads', 'url_id');
              END IF;
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
      `);

    console.log('✓ URL generation functions created');
    return true;
  } catch (error) {
    console.error('✗ Error creating URL generation functions:', error);
    throw error;
  }
};
