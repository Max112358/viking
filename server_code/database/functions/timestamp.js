// database/functions/timestamp.js
module.exports = async (client) => {
  try {
    await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql VOLATILE;
      `);
    console.log('✓ Timestamp function created');
    return true;
  } catch (error) {
    console.error('✗ Error creating timestamp function:', error);
    throw error;
  }
};
