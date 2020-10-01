
mysql -u zmuser --password=zmpass zm -e "INSERT INTO Users(Username, Password, Language, Enabled, Stream, Events, Control, Monitors, Groups, Devices, System, MaxBandwidth, MonitorIds, TokenMinExpiry, APIEnabled) VALUES ('${ZM_USER}', 'changeme', 'en_us', 1, 'View', 'Edit', 'Edit', 'Edit', 'Edit', 'None', 'Edit', 'high', NULL, 0, 1);"
