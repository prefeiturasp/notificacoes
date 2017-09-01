Task("Clean")
    .Does(() =>
{    
    CleanDirectories("./src/**/bin/" + configuration);
    var outputDir = buildSettings.OutputDirectory;

    if(DirectoryExists(outputDir))
    {       
        DeleteDirectory(outputDir,recursive:true);
    }  
});

Task("Restore-NuGet-Packages")
    .IsDependentOn("Clean")
    .Does(() =>
{

    NuGetRestore(buildSettings.SolutionFile);
});

Task("Build")
    .IsDependentOn("Restore-NuGet-Packages")
    .Does(() =>
{
    MSBuild(buildSettings.SolutionFile, settings => 
    settings.SetConfiguration(configuration)
            .SetVerbosity(Verbosity.Minimal));
});

Task("WebProject")
    .IsDependentOn("Build")
    .Does(() =>
{
    PublishAllWebSites(buildSettings);
});

Task("Database")
    .IsDependentOn("Build")  
    .Does(() =>
{
    PublishAllDatabases(buildSettings);
});

Task("WindowsServices")
    .IsDependentOn("Build")
    .Does(() =>
{
    PublishAllWindowsServices(buildSettings);
});

Task("ReportingServices")
    .IsDependentOn("Build")
    .Does(() =>
{
    PublishAllReportingServices(buildSettings);
});


Task("Zip")
    .Does(() =>
{
    Zip(buildSettings.PublishDirRootVersion,  parameters.ZipFileName);
});


Task("NPM-Install")
.Does(() =>
{
    var projectWebPath = Directory("src") + Directory("Notification.Web");
    Information("Project web path: {0}", projectWebPath);

    var settings = new NpmInstallSettings();

    settings.LogLevel = NpmLogLevel.Info;
    settings.WorkingDirectory = projectWebPath;
    settings.Production = true;

    NpmInstall(settings);
});

Task("Grunt")
  .Does(() =>
{
    var projectWebPath = Directory("src") + Directory("Notification.Web");
    Information("Project web path: {0}", projectWebPath);
    Grunt.Global.Execute(settings => settings.WithGruntFile( projectWebPath + File("Gruntfile.js") ));
});